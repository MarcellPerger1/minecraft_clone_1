import { alea } from "../alea/alea.js";
import { rangeFrom, rangeList } from "../utils/array_utils.js";
import { BaseGenerator } from "./base_generator.js";


export class TreePlacer extends BaseGenerator {
  constructor(game) {
    super(game);
  }

  getGenerator() {
    switch (this.gcnf.treeCollideAction) {
      case "avoid":
        return new AvoidTreePlacer(this);
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
    return rangeList(this.n).map(_ => this.idxToCoord(this.rng.randint(0, this.n)));
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
