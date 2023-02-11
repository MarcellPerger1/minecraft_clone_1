import { alea } from "../alea/alea.js";
import { binarySearchOr, rangeFrom, rangeList } from "../utils/array_utils.js";
import { BaseGenerator } from "./base_generator.js";


export class TreePlacer extends BaseGenerator {
  constructor(game) {
    super(game);
  }

  getGenerator() {
    switch (this.gcnf.treeCollideAction) {
      case "avoid-old":
        return new AvoidTreePlacer(this);
      case "avoid-fast":
      case "avoid":
        return new AvoidTreePlacerFast(this);
      case "place":
        return new IgnoreTreePlacer(this);
      case "skip":
        return new SkipTreePlacer(this);
      default:
        throw new ReferenceError("Unknown treePlaceMode");
    }
  }

  makeTrees() {
    return this.getGenerator().makeTrees();
  }
}


export class BaseTreePlacer extends BaseGenerator {
  constructor(game, {seed=true, treeBounds=true}={}) {
    super(game);
    this.n = this.wSize[0] * this.wSize[2];
    if(seed) {
      this.seed = this.getSeed("tree-pos", 0);
      this.rng = alea(this.seed);
    }
    if(treeBounds) {
      let w = this.gcnf.treeRadius[0];
      let h = this.gcnf.treeRadius[1];
      /** @type {Array<[number, number]>} */
      this.excludeOffsets = rangeFrom(-w, w+1)
        .flatMap(x => rangeFrom(-h, h+1)
          .map(y => [x, y]));
    }
  }

  makeTrees() {
    throw new ReferenceError(
      "makeTrees must be implemented on TreePlacers " +
      "(i.e. classes that inherit from BaseTreePlacer)")
  }

  /**
   * @param {number} idx
   * @retuns {[number, number]}
   */
  idxToCoord(idx) {
    let z = Math.floor(idx / this.wSize[0]);
    let x = idx % this.wSize[0];
    return [x, z];
  }

  /**
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  coordToIdx(x, z) {
    return this.wSize[0] * z + x;
  }
}


export class IgnoreTreePlacer extends BaseTreePlacer {
  constructor(game) {
    super(game, {treeBounds: false});
  }

  makeTrees() {
    return rangeList(this.gcnf.nTrees)
      .map(_ => this.idxToCoord(this.rng.randint(0, this.n)));
  }
}


export class SkipTreePlacer extends BaseTreePlacer {
  constructor(game) {
    super(game);
  }

  makeTrees() {
    let columns = new Uint8Array(this.n);
    return rangeList(this.n).map(_ => {
      let idx = this.rng.randint(0, this.n);
      let c = this.idxToCoord(idx);
      if(!columns[idx]) {
        for(const [xo, yo] of this.excludeOffsets) {
          columns[this.coordToIdx(c[0] + xo, c[1] + yo)] = 1;
        }
        return c;
      }
    }).filter(c => c != null);
  }
}

export class SkipTreePlacerFast extends BaseTreePlacer {
  makeTrees() {
    let trees = [];
    let blocked = new Set();
    for(let ti=0; ti<this.gcnf.nTrees; ti++) {
      let idx = this.rng.randint(0, this.n);
      if(blocked.has(idx)) {
        continue;
      }
      let c = this.idxToCoord(idx);
      for(const [xo, yo] of this.excludeOffsets) {
        const i = this.coordToIdx(c[0] + xo, c[1] + yo);
        if(i >= 0 && i < this.n) { 
          blocked.add(i); 
        }
      }
      trees.push(c);
    }
    return trees;
  }
}


export class AvoidTreePlacer extends BaseTreePlacer {
  constructor(game) {
    super(game);
  }

  makeTrees() {
    // TODO this is very bad complexity,
    // should redo (see issue #95: option 3 best)
    // This is O(trees * x * z * tree_size)
    // and basically a lazier version of option 2
    // but its better than nothing and
    // when I can be bothered, I will redo this with option 3
    // as it is by far the most complicated
    let positions = [];
    /** @type {Array<[boolean, number, number]>}*/
    var colData = rangeList(this.n)
      .map(i => [/*free*/true, /*real*/i, /*cumulative*/i]);
    var numLeft = this.n;
    for (let ti = 0; ti < this.gcnf.nTrees; ti++) {
      if (numLeft <= 0) {
        console.warn("Not enough places for trees.");
        return positions;
      }
      let cumIdx = this.rng.randint(0, numLeft);
      let realIdx = colData.findIndex(v => v[0] && v[2] === cumIdx);
      let column = colData[realIdx];
      if (!column[0]) throw new Error("Assertion failed");
      positions.push(this.idxToCoord(realIdx));
      /** @type {number[]} */
      var removed = [];
      for (let [xo, zo] of this.excludeOffsets) {
        let idx = this.coordToIdx(xo, zo) + realIdx;
        // out of chunk; ignore for now
        if (idx < 0 || idx >= this.n) { continue; }
        let thisCol = colData[idx];
        // already out
        if (!thisCol[0]) { continue; }
        thisCol[0] = false;
        removed.push(idx);
        numLeft--;
      }
      colData.forEach((v, i) => {
        let sub = removed.filter(rmIdx => i > rmIdx).length;
        v[2] -= sub;
      });
    }
    return positions;
  }
}


const DEBUG = false;


// O(trees**2 * tree_size) algorithm
export class AvoidTreePlacerFast extends BaseTreePlacer {
  constructor(game) {
    super(game);
  }

  makeTrees() {
    function getRealIdx(cumIdx) {
      var lastBlocked = -1;
      // work out cumulative idx before first blocked:
      // cumulative = real here as no blocked yet
      var lastCum = blocked[0] - 1;
      if(cumIdx <= lastCum) {
        return cumIdx;
      }
      for(let blockedIdx of blocked) {
        let availableSize = blockedIdx - lastBlocked - 1
        let thisCum = lastCum + availableSize;
        if(cumIdx <= thisCum) {
          return lastBlocked + (cumIdx - lastCum);
        }
        lastCum = thisCum;
        lastBlocked = blockedIdx;
      }
      // must be after all blocked
      return lastBlocked + (cumIdx - lastCum);
    }
    const insertIntoBlocked = (realIdx) => {
      if(this.idxToCoord(realIdx).some(v=> v < 0)){
        return;
      }
      let res = binarySearchOr(blocked, realIdx);
      if(res.found) {
        return;  // already blocked
      }
      var [_lo, hi] = res.idx;
      blocked.splice(hi, 0, realIdx);
    }
    let trees = [];
    let blocked = [];
    for(let ti=0; ti<this.gcnf.nTrees; ti++) {
      if(ti === 0) {
        let idx = this.rng.randint(0, this.n);
        trees.push(idx);
        blocked.push(idx);
        continue;
      }
      let blockedCnt = blocked.length;
      let availableCnt = this.n - blockedCnt;
      if(availableCnt < 0) {
        console.warn("Not enough places for trees.");
        break;
      }
      let cumIdx = this.rng.randint(0, availableCnt);
      let realIdx = getRealIdx(cumIdx);
      let realCoord = this.idxToCoord(realIdx);
      if(DEBUG && blocked.includes(realIdx)) {
        throw new Error("Generated tree inside tree!");
      }
      for(let off of this.excludeOffsets) {
        let idx = this.coordToIdx(realCoord[0] + off[0], realCoord[1] + off[1]);
        insertIntoBlocked(idx);
      }
      
      trees.push(realIdx);
    }
    trees = trees.map(this.idxToCoord, this);
    return trees;
  }
}
