import {rangeList} from "../utils/array_utils.js";

export class SeedFork {
  static getSeedExtra(what, index) {
    return `.!${what}[${index}]`;
  }

  static getSeed(orig, what, index) {
    return String(orig) + this.getSeedExtra(what, index);
  }

  static getSeeds(seed, what, n) {
    // get `n` seeds from a single seed
    return rangeList(n).map((i) => this.getSeed(seed, what, i));
  }
}
