import { alea } from "../alea/alea.js";
import { rangeFrom, rangeList } from "../utils.js";
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

/**
 * @typedef {{start: number, end: number, cumSize: number}} Section
*/
// ^ end is exclusive

export class AvoidTreePlacerFast extends BaseTreePlacer {
  constructor(game) {
    super(game);
  }

  makeTrees() {
    /*
     - Find tree position,
     - Split into contiguous sections,
     - Find which section new number is in: 
       - using calculated cumulative size of sections 
       - then binary search for index of section
       - then easy to find in that section (using start and end indces of the section)
    */
    let positions = [];
    /** @type {Section[]} */
    let sections = [];
    for(let ti=0; ti<this.gcnf.nTrees; ti++) {
      let selected_i_cum = this.rng.randint(0, sections.at(-1).cumSize);  // O(1)
      function threeWayCmp(/**@type{number}*/item, /**@type{Section}*/v, i) {
        if(item >= v.cumSize) {
          return 1; // item > v
        }
        let prevCumSize = (sections[i-1] ?? {cumSize: 0}).cumSize;
        if(item >= prevCumSize) {
          return 0; // item > prev -> item in v
        }
        return -1; // item < v
      }
      var lo = 0;
      var hi = list.length;
      while (lo <= hi) {
        let mid = Math.floor((lo + hi) / 2);
        let cmpRes = threeWayCmp(item, list[mid]);
        if (cmpRes === 0) {
          return mid;
        }
        if (cmpRes < 0) {
          hi = mid - 1;
        } else {
          // cmpRes > 0
          lo = mid + 1
        }
      }
      return -1;
    }
  }
}
