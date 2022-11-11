import { numCmp } from './math.js';
import { isAnyArray } from './type_check.js';

// may modify list inplace, but doesnt have to
export function iextend(a, b) {
  if (b.length < 32_000) {
    a.push(...b);
    return a;
  }
  if (a.length < b.length / 2) {
    // a much smaller than b -  use concat (copy not too expensive)
    return a.concat(b);
  }
  if (b.length < a.length / 2) {
    // b much smaller - just use a loop
    for (const v of b) {
      a.push(v);
    }
    return a;
  }
  return a.concat(b);
}

/**
 * Extends array `a` with all non-nullish items from each of args
 * @template T
 * @param {T[]} a
 * @param {readonly T[][]} args
 * @returns {T[]}
 */
export function extendNullSafe(a, ...args) {
  for (const other of args)
    if (other != null)
      a.push(...other.filter(v => v != null));
  return a;
}


export function assignNullSafe(a, ...args) {
  for (const other of args) {
    if (other == null) { continue; }
    for (const [k, v] of Object.entries(other)) {
      a[k] = v ?? a[k];
    }
  }
  return a;
}

export function setDefaults(a, ...args) {
  for (const other of args) {
    if (other == null) { continue; }
    for (const [k, v] of Object.entries(other)) {
      a[k] ??= v;
    }
  }
}

/**
 * Return lower and upper bound of the hyperrectangle with 2 opposite corners `p0` and `p1` (also inplace)
 * @template {number[]} T
 * @param {T} p0
 * @param {T} p1
 * @returns {[T, T]}
 */
export function sortCoords(p0, p1) {
  let len = p0.length;
  if (p0.length != p1.length) {
    throw new RangeError("Arrays must be same len");
  }
  for (let i = 0; i < len; i++) {
    if (p0[i] > p1[i]) {
      [p0[i], p1[i]] = [p1[i], p0[i]];
    }
  }
  return [p0, p1];
}

/**
 * Returns `[func(i) for i in range(n)]`
 * @template T
 * @param {number} n
 * @param {(i: number) => T} func
 * @param {Object} thisArg
 * @returns {T[]}
 */
export function forRange(n, func, thisArg = null) {
  return Array(n).fill(0).map((_v, i) => func.call(thisArg, i));
}


/**
 * @template T
 * @typedef {Array<T | RecursiveArray<T>>} RecursiveArray
 */

/**
 * Returns a nested array with each element being determined by `func(path)`
 * @template {Array<number>} T, V
 * @param {readonly T} shape - The length of each subsequent nested array
 * @param {(path: T) => V} func
 * @param {Object} thisArg
 * @returns {RecursiveArray<V>}
 */
export function fromNested(shape, func, thisArg = null) {
  var path = [];
  /** @type {(i: number) => V | Array<V | Array>} */
  let inner = (i) => {
    path.push(i);
    let value = path.length == shape.length
      ? func.call(thisArg, path.slice())
      : forRange(shape[path.length], inner);
    path.pop();
    return value;
  }
  return forRange(shape[0], inner);
}

/**
 *
 * @template T
 * @param {RecursiveArray<T>} arr
 * @param {(v: T, i: number[], arr: RecursiveArray<T>, a: T[]) => void} func
 * @praram {Object} thisArg
 * @param {number[]} [path_prefix]
*/
export function nestedFor(arr, func, thisArg = null, path_prefix = []) {
  var path = path_prefix.slice();
  arr.forEach((v, i, a) => {
    let p = path.concat(i);
    if (isAnyArray(v)) {
      nestedFor(v, func, thisArg, p);
    } else {
      func.call(thisArg, v, p, arr, a);  // throw eveything at the function
    }
  })
}

/**
 * Similar to python range(n), returns integers 0 to n (end exculsive)
 * @param {number} n
 * @returns {Array<number>}
 */
export function rangeList(n) {
  return Array(n).fill(0).map((_, i) => i);
}

/**
 * Almost exactly like python range but without `step`
 * @param {number} start
 * @param {number} stop
 * @returns {number[]}
 */
export function rangeFrom(start, stop = null) {
  // argument juggling
  if (stop == null) {
    stop = start;
    start = 0;
  }
  return Array(stop - start).fill(0).map((_, i) => start + i);
}


/**
 * Binary search
 * @template T, S
 * @param {Array<T>} list
 * @param {S} item
 * @param {(item: S, v: T) => (0|1|-1)} threeWayCmp -1=>i<v,0=>i==v,+1=>i>v
 * @returns {number} index if found; else -1
 */
export function binarySearch(list, item, threeWayCmp) {
  threeWayCmp ??= numCmp;
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
