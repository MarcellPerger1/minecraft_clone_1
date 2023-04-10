import { isFunction } from "./type_check.js";
import { assert } from "./assert.js";

/**
 * Return an object with all of `keys` set to `value`
 * @template KT, VT
 * @param {KT[]} keys
 * @param {VT} value
 * @returns {{[k: KT]: VT}}
 */
export function fromKeys(keys, value) {
  return Object.fromEntries(keys.map((k) => [k, value]));
}

// null-ish if not clone
const clonedFrom = Symbol("clonedFrom");
export function cloneFunction(x) {
  assert(isFunction(x));
  var orig = x[clonedFrom] ?? x;
  var res = function (...args) {
    return orig.apply(this, args);
  };
  Object.assign(res, orig);
  res[clonedFrom] = orig;
  return res;
}
