import { alea } from "../alea/alea.js";
import { binarySearch, binarySearchOr, rangeFrom, rangeList } from "../utils/array_utils.js";
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


const DEBUG = false;


// O(trees**2 * tree_size) algorithm
export class AvoidTreePlacerBetter extends BaseTreePlacer {
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

/**
 * @typedef {{start: number, end: number, cumSize: number}} Section
*/
// ^ end is exclusive

export class AvoidTreePlacerFast extends BaseTreePlacer {
  constructor(game) {
    super(game);
    this.treeStripsR = this.gcnf.treeRadius[1]
    this.nStrips = this.treeStripsR * 2 + 1;
    this.stripR = this.gcnf.treeRadius[0];
    this.stripSize = this.stripR * 2 + 1;
  }

  makeTrees() {
    /*
    1 Split into contiguous sections (one contiguous section at start)
    2 Find cumulative index of tree,
    3 Find real index of tree
      .1 Find which section cumulative index is in:
        using calculated cumulative size of sections 
        and binary search for index of containing section
      .2 then find in that section (using start and end indices of the section)
    4 Add new position to tree positions
    5 For each strip of tree:
      .1 Get real index at start and end
      .2 Get sections of each index
      .3 If section not found:
        .1 If for start, take next section
        .2 If for end, take previous section
      .4 If the start section if after the end section:
        .1 Continue onto next strip of tree
      .5 If the start and end sections are the same:
        .1.1 Find the sub-section before the tree
        .1.2 If it has width 0, discard it
        .1.3 Else, insert it into the list
        .2.1 Find the sub-section after the tree
        .2.2 If it has width 0, discard it
        .2.3 Else, insert it into the list
        .3 Remove old section from list and continue onto next strip
      .6 For each section between the start and end section:
        .1 If the section is the start section:
          .1 Find the sub-section before the tree
          .2 If it has width 0, discard it
          .3 Else, insert it into the list
          .4 Remove original
        .2 If the section is the end section:
          .1 Find the sub-section after the tree
          .2 If it has width 0, discard it
          .3 Else, insert it into the list
          .4 Remove original
        .3 Else (if it is fully contained): 
          .1 Remove it
    6 Recalcuate cumSize:
      .1 ...
    */
    let positions = [];
    // Step 1: O(1)
    let nColumns = this.wSize[0] * this.wSize[2];
    /** @type {Section[]} */
    let sections = [{start: 0, end: nColumns, cumSize: nColumns}];
    function cmpRealIdx(/**@type{number}*/item, /**@type{Section}*/v) {
      if(item < v.start) {
        return -1;
      }
      if(item >= v.end) {
        return 1;
      }
      return 0;
    }
    function getSecSize(/**@type {Section}*/sec) {
      return sec.end - sec.start;
    }
    function getSectionIdxAtRealIdx(realIdx, useInterval=false){
      // O(log2(sections.length))
      return (useInterval ? binarySearchOr : binarySearch)(sections, realIdx, cmpRealIdx);
    }
    // O(trees * ...)
    for(let ti=0; ti<this.gcnf.nTrees; ti++) {
      // Step 2: O(1)
      let selected_i_cum = this.rng.randint(0, sections.at(-1).cumSize);
      // Step 3.1: O(log2(sections.length)) = O(log2(tree_size_z * trees))
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
      let sectionIdx = binarySearch(sections, selected_i_cum, threeWayCmp);
      // Step 3.2: O(1)
      let section = sections[sectionIdx];
      let distEnd = section.cumSize - selected_i_cum;
      let realIdx = section.end - distEnd;
      let realCoord = this.idxToCoord(realIdx);
      // Step 4: O(1)
      positions.push(realCoord);
      // Step 5: O(tree_size_x * ...)
      for(let xo = -this.treeStripsR; xo <= this.treeStripsR; xo++) {
        // Step 5.1: O(1)
        let startCoord = [realCoord[0] + xo, realCoord[1] - this.stripR];
        let endCoord = [realCoord[0] + xo, realCoord[1] + this.stripR];
        // Step 5.2: O(log2(sections.length)) = O(log2(tree_size_z * trees))
        let startSecRes = binarySearchOr(sections, this.coordToIdx(startCoord), cmpRealIdx);
        let endSecRes = binarySearchOr(sections, this.coordToIdx(endCoord), cmpRealIdx);
        // Step 5.3.1: O(1)
        let startSecIdx = startSecRes.found ? startSecRes.idx : startSecRes.idx[1];
        // Step 5.3.2: O(1)
        let endSecIdx = endSecRes.found ? endSecRes.idx : endSecRes.idx[0];
        // Step 5.4.1: O(1)
        if(endSecIdx < startSecIdx) {
            continue;
        }
        if(endSecIdx === startSecIdx) {
          let secIdx = endSecIdx;  // since they are equal
          let sec = sections[secIdx];
          let extraSecs = [];
          // Step 5.5.1: O(1)
          {
            // Step 5.5.1.1
            let end = this.coordToIdx(...startCoord);
            let subsecPrev = {
              start: sec.start, end, 
              // cumSize shouldn't be used anyway before next tree iteration
              // when it must be recalculated so safe to leave as null.
              // Also, would be *very* inconvenient to 
              // have to correcly calculate it here so leave it as null
              cumSize: null};
            // sec.cumSize - /*difference in size*/(sec.end - end)
            // Step 5.5.1.2
            if(getSecSize(subsecPrev) > 0) {
              extraSecs.push(subsecPrev);
            }
          }
          // Step 5.5.2: O(1)
          {
            // Step 5.5.2.1
            let start = this.coordToIdx(...endCoord) + 1;
            let subsecNext = {
              start, end: sec.end, 
              // see comment above
              cumSize: null};
            // sec.cumSize - /*difference in size*/(sec.start - start)
            // Step 5.5.2.2
            if(getSecSize(subsecNext) > 0) {
              extraSecs.push(subsecNext);
            }
          }
          // Step 5.5.3, 5.5.1.3, 5.5.2.3: O(sections.length)
          sections.splice(secIdx, 1, ...extraSecs);
          continue;
        }
        let delCnt = 0;
        let addExtra = [];
        // roughly O(tree_size_z * tree_density * ...) but negligible with small trees
        // = O(tree_size_x * tree_density * 1)
        for(let currSecIdx=startSecIdx; currSecIdx<=endSecIdx; currSecIdx++) {
          // Step 6.1.1 - .2: O(1)
          if(currSecIdx === startSecIdx) {
            let secPrev = {start: sec.start, end: this.coordToIdx(...startCoord)};
            if (getSecSize(secPrev) > 0) addExtra.push(secPrev);
          // Step 6.2.1 - .2: O(1)
          } else if(currSecIdx == endSecIdx) {
            let secNext = {start: this.coordToIdx(...endCoord) + 1, end: sec.end};
            if (getSecSize(secNext) > 0) addExtra.push(secNext);
          }
          // Step 6.3: else (if contained), don't add any extra
          delCnt++;
        }
        // Rest of step 6: O(sections.length)
        sections.splice(secIdx, delCnt, ...addExtra);
      }
      // Step 6
      // ...
    }
  }
}


