import { assert } from "./assert.js";

export function sum(array, initval = 0) {
  return array.reduce((a, b) => a + b, initval);
}

export function clamp(v, min, max) {
  return min != null && v < min ? min : max != null && v > max ? max : v;
}

export function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

export function inRange(v, low, high, inclusive = null) {
  return inclusive?.low ?? true
    ? low <= v
    : low < v && (inclusive?.high ?? true)
    ? high <= v
    : high < v;
}

const chars = "0123456789abcdefghijklmnopqrstuvwxyz";

export function charIsDigit(c, base = 10) {
  let i = chars.indexOf(c.toLowerCase());
  return 0 <= i && i < base;
}

export function toRad(x) {
  return (x * Math.PI) / 180;
}

/**
 * Round `x` to nearest `n`
 * @param {number} x
 * @param {number} [n=1]
 * @returns {number} result
 */
export function roundNearest(x, n = 1) {
  return Math.round(x / n) * n;
}

export function nearRoundNearest(x, n = 1, tol = 0.00001) {
  assert(
    x % n < tol || x % n > n - tol,
    `x should be within ${tol} of nearest ${n}`
  );
  return roundNearest(x, n);
}

/**
 * Calculate `x % y` (always as poistive number; Python-like)
 * @param {number} x
 * @param {number} y
 * @returns {number} result
 */
export function mod(x, y) {
  let r = x % y;
  return r < 0 ? r + y : r;
}

/**
 * Returns `-1` if `a < b`, `0` if `a == b`, `+1` if `a > b`
 * @param {number} a
 * @param {number} b
 * @returns {(-1 | 0 | 1)}
 */
export function numCmp(a, b) {
  return a == b ? 0 : a < b ? -1 : 1;
}

/**
 * Returns `[a/b, a%b]`
 * @param {number} a
 * @param {number} b
 * @param {boolean} [jsMod=false] - Use the js `%` instead of python `%`
 * @returns {[number, number]}
 */
export function divmod(a, b, jsMod = false) {
  return [Math.floor(a / b), jsMod ? a % b : mod(a, b)];
}

/**
 * Returns `[a%b, a/b]`
 * @param {number} a
 * @param {number} b
 * @param {boolean} [jsMod=false] - Use the js `%` instead of python `%`
 * @returns {[number, number]}
 */
export function moddiv(a, b, jsMod = false) {
  return [jsMod ? a % b : mod(a, b), Math.floor(a / b)];
}
