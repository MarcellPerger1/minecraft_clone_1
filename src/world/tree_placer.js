import { SeedFork } from "./octave_noise.js";
import { alea } from "../libs/alea/alea.js";
import { rangeList } from "../utils.js";


/** @type {Array<[number, number]>} */
var OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [0, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1]
];

export class TreePosGetter {
  constructor(seed, x, z, n_trees) {
    this.wx = x;
    this.wz = z;
    this.n = this.wx * this.wz;
    this.n_trees = n_trees;
    this.globSeed = seed;
    this.seed = SeedFork.getSeed(this.globSeed, "tree-pos", 0);
    this.rng = alea(this.seed);
  }

  makeTrees(){
    let positions = [];
    /** @type {Array<[boolean, number, number]>}*/
    var colData = rangeList(this.n).map(i => [/*free*/true, /*real*/i, /*cumulative*/i]);
    var numLeft = this.n;
    for(let ti = 0; ti < this.n_trees; ti++){
      if(numLeft<=0) {
        console.warn("Not enough places for trees."); 
        return positions; 
      }
      let colIdx = this.rng.randint(0, numLeft);
      let spotsLeft = colData.filter(v=>v[0]);
      let column = spotsLeft[
        binarySearch(spotsLeft, colIdx, (item,v) => numCmp(item, v[2]))];
      let realIdx = column[1];
      if(!colData[realIdx][0]) throw new Error("Assertion failed");
      positions.push(this.idxToCoord(realIdx));
      var removed = [];
      for(let [xo, zo] of OFFSETS) {
        let idx = this.coordToIdx(xo, zo) + realIdx;
        // out of chunk; ignore for now
        if(idx<0 || idx>=this.n){ continue; }
        // already out
        if(!colData[idx][0]) { continue; }
        colData[idx][0] = false;
        removed.push(idx);
        numLeft--;
      }
      colData.forEach((v, i) => {
        let sub = 0;
        for(let rmIdx of removed) {
          if(i>rmIdx) {
            sub++;
          }
        }
        v[2] -= sub;
      })
    }
    return positions;
  }

  coordToIdx(x, z) {
    return this.wx * z + x;
  }
  idxToCoord(idx) {
    let z = Math.floor(idx / this.wx);
    let x = idx % this.wx;
    return [x, z];
  }
}

function numCmp(a, b) {
  return a == b ? 0 : (a < b ? -1 : 1)
}

/**
 * Binary search
 * @template T, S
 * @param {Array<T>} list
 * @param {S} item
 * @param {(item: S, v: T) => (0|1|-1)} threeWayCmp -1=>i<v,0=>i==v,+1=>i>v
 * @returns {number} index if found; else -1
 */
function binarySearch(list, item, threeWayCmp) {
  var lo = 0;
  var hi = list.length;
  while(lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    let cmpRes = threeWayCmp(item, list[mid]);
    if(cmpRes === 0) {
      return mid;
    }
    if(cmpRes < 0) {
      hi = mid - 1;
    } else {
      // cmpRes > 0
      lo = mid + 1
    }
  }
  return -1;
}
