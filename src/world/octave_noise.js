import {rangeList} from "../utils.js";
import SimplexNoise from "../libs/simplex-noise/simplex-noise.js";


class SeedFork {
  static getSeedExtra(what, index) {
    return `.!${what}[${index}]`
  }

  static getSeed(orig, what, index) {
    return toString(orig) + this.getSeedExtra(what, index);
  }

  static getSeeds(seed, what, n) {
    // get `n` seeds from a single seed]
    return rangeList(n).map(i => this.getSeed(seed, what, i))
  }
}

/**
 * @typedef {[number, number, number]} Vec3
 */


export class OctaveNoise {
  /**
   * Return new OctaveNoise object
   * @param {(string|number)} seed - Master seed
   * @param {string} name - What this is used for; Used for unique values of each OctaveNoise
   * @param {Object} config
   * @param {Vec3} config.nScale
   * @param {Vec3} config.octaveMult
   * @param {number} config.layers
   * @param {?(number|'auto')} [config.nMedian=null]
   * @param {?(number|((n:OctaveNoise) => number))} nMedianDefault - Function to get noise median; default is ensure above 0
   */
  constructor(seed, name, config, nMedianDefault=0) {
    this.name = name;
    this.seed = seed;
    this.cnf = config;
    this.nMedianDefault = nMedianDefault;
    this.seeds = SeedFork.getSeeds(this.seed, this.name, this.cnf.layers);
    this.noises = this.seeds.map(s => new SimplexNoise(s));
  }

  noise2D(x, z) {
    let ny = 0;
    let xm = this.cnf.nScale[0];
    let ym = this.cnf.nScale[1];
    let zm = this.cnf.nScale[2];
    for (let i = 0; i < this.cnf.layers; i++) {
      ny += ym * this.noises[i].noise2D(x / xm, z / zm);
      xm *= this.cnf.octaveMult[0];
      ym *= this.cnf.octaveMult[1];
      zm *= this.cnf.octaveMult[2];
    }
    let nMed = this.cnf.nMedian;
    let nMedDef = this.nMedianDefault;
    if (nMed == null || nMed == "auto") {
      nMed = (typeof nMedDef === "function" ? nMedDef(this): nMedDef) ?? 0;
    }
    let fval = ny + nMed;
    return fval;
  }

  minValue() {
    let ym = this.cnf.nScale[1];
    let y = 0;
    for(let i = 0; i < this.cnf.layers; i++) {
      y += -1 * ym;
      ym *= this.cnf.octaveMult[1];
    }
    return y;
  }

  maxValue() {
    let ym = this.cnf.nScale[1];
    let y = 0;
    for(let i = 0; i < this.cnf.layers; i++) {
      y += 1 * ym;
      ym *= this.cnf.octaveMult[1];
    }
    return y;
  }
}
