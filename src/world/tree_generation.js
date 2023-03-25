import { alea } from "../alea/alea.js";
import { binarySearchOr, rangeFrom, rangeList } from "../utils/array_utils.js";
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
  constructor(game, { seed = true, treeBounds = true } = {}) {
    super(game);
    this.n = this.wSize[0] * this.wSize[2];
    if (seed) {
      this.seed = this.getSeed("tree-pos", 0);
      this.rng = alea(this.seed);
    }
    if (treeBounds) {
      let w = this.gcnf.treeRadius[0];
      let h = this.gcnf.treeRadius[1];
      /** @type {Array<[number, number]>} */
      this.excludeOffsets = rangeFrom(-w, w + 1).flatMap((x) =>
        rangeFrom(-h, h + 1).map((y) => [x, y])
      );
    }
  }

  makeTrees() {
    throw new ReferenceError(
      "makeTrees must be implemented on TreePlacers " +
        "(i.e. classes that inherit from BaseTreePlacer)"
    );
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
    super(game, { treeBounds: false });
  }

  makeTrees() {
    return rangeList(this.gcnf.nTrees).map((_) =>
      this.idxToCoord(this.rng.randint(0, this.n))
    );
  }
}

export class SkipTreePlacer extends BaseTreePlacer {
  makeTrees() {
    let trees = [];
    let blocked = new Set();
    for (let ti = 0; ti < this.gcnf.nTrees; ti++) {
      let idx = this.rng.randint(0, this.n);
      if (blocked.has(idx)) {
        continue;
      }
      let c = this.idxToCoord(idx);
      for (const [xo, yo] of this.excludeOffsets) {
        const i = this.coordToIdx(c[0] + xo, c[1] + yo);
        if (i >= 0 && i < this.n) {
          blocked.add(i);
        }
      }
      trees.push(c);
    }
    return trees;
  }
}

const DEBUG = false;

// O(trees**2 * tree_size) algorithm
export class AvoidTreePlacer extends BaseTreePlacer {
  makeTrees() {
    function getRealIdx(cumIdx) {
      var lastBlocked = -1;
      // work out cumulative idx before first blocked:
      // cumulative = real here as no blocked yet
      var lastCum = blocked[0] - 1;
      if (cumIdx <= lastCum) {
        return cumIdx;
      }
      for (let blockedIdx of blocked) {
        let availableSize = blockedIdx - lastBlocked - 1;
        let thisCum = lastCum + availableSize;
        if (cumIdx <= thisCum) {
          return lastBlocked + (cumIdx - lastCum);
        }
        lastCum = thisCum;
        lastBlocked = blockedIdx;
      }
      // must be after all blocked
      return lastBlocked + (cumIdx - lastCum);
    }
    const insertCoordIntoBlocked = (c) => {
      const realIdx = this.coordToIdx(...c);
      if (
        c[0] < 0 ||
        c[1] < 0 ||
        c[0] >= this.wSize[0] ||
        c[1] >= this.wSize[2]
      ) {
        return;
      }
      let res = binarySearchOr(blocked, realIdx);
      if (res.found) {
        return; // already blocked
      }
      var [_lo, hi] = res.idx;
      blocked.splice(hi, 0, realIdx);
    };
    let trees = [];
    let blocked = [];
    for (let ti = 0; ti < this.gcnf.nTrees; ti++) {
      if (ti === 0) {
        let idx = this.rng.randint(0, this.n);
        trees.push(idx);
        blocked.push(idx);
        continue;
      }
      let blockedCnt = blocked.length;
      let availableCnt = this.n - blockedCnt;
      if (availableCnt < 0) {
        console.warn("Not enough places for trees.");
        break;
      }
      let cumIdx = this.rng.randint(0, availableCnt);
      let realIdx = getRealIdx(cumIdx);
      let realCoord = this.idxToCoord(realIdx);
      if (DEBUG && blocked.includes(realIdx)) {
        throw new Error("Generated tree inside tree!");
      }
      for (let off of this.excludeOffsets) {
        let c = [realCoord[0] + off[0], realCoord[1] + off[1]];
        insertCoordIntoBlocked(c);
      }

      trees.push(realIdx);
    }
    trees = trees.map(this.idxToCoord, this);
    return trees;
  }
}
