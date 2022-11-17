/*
The ALEA PRNG and masher code used by simplex-noise.js version 3.0.1
is based on code by Johannes Baagøe (see ALEA_LICENSE for the full license), modified by Jonas Wagner (code from https://github.com/jwagner/simplex-noise.js/blob/3.0.1/simplex-noise.ts#L440-L493, for license, see SIMPLEX_NOISE_LICENSE).
Modified again by Marcell Perger.
*/

/**
 * @typedef {Object} RandomNS
 * @prop {() => number} random
 * @prop {() => number} randbits_32
 * @prop {(n: number) => number} randbelow
 * @prop {(lo: number, hi: number) => number} randrange
 * @prop {(lo: number, hi: number) => number} randint
 */
/**
 * @typedef {(RandomNS & (() => number))} Random
 */

/**
 * Create an ALEA PRNG initalised by a seed
 * @param {(number|string)} seed
 * @returns {Random} Function that generates random numbers
 */
export function alea(seed) {
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let c = 1;

  const mash = masher();
  s0 = mash(' ');
  s1 = mash(' ');
  s2 = mash(' ');

  s0 -= mash(seed);
  if (s0 < 0) {
    s0 += 1;
  }
  s1 -= mash(seed);
  if (s1 < 0) {
    s1 += 1;
  }
  s2 -= mash(seed);
  if (s2 < 0) {
    s2 += 1;
  }
  /** @type {(Random)} */
  let ret = function() {
    const t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
    s0 = s1;
    s1 = s2;
    return s2 = t - (c = t | 0);
  };
  Object.assign(ret, {
    random() {
      return ret();
    },
    randbits_32() {
      return (ret() * 0x100000000/* 2^32 */) | 0; // cast to int
    },
    randbelow(n) {
      return ret() * n;
    },
    randrange(lo, hi) {
      // aka uniform distribution
      // lo <= x < hi (but exclusivity is not guranteed at top end of range)
      return lo + ret.randbelow(hi - lo);
    },
    randint(lo, hi) {
      // return random int x where lo <= x < hi
      let v = Math.floor(ret.randrange(lo, hi));
      return v < hi ? v : hi - 1;
    }
  });
  return ret;
}

function masher() {
  let n = 0xefc8249d;
  return function(data) {
    data = data.toString();
    for (let i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      let h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };
}