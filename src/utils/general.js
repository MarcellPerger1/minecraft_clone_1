import { isString, isFunction } from "./type_check.js";
import { assert } from "./assert.js";

export function expectValue(v, name = null) {
  name = name ?? v?.name;
  if (name == null) {
    console.warn("Name not specified!");
  }
  if (v == null) {
    throw new ReferenceError(`${name} must not be null!`);
  }
  return v;
}

/**
 * Return an object with all of `keys` set to `value`
 * @template KT, VT
 * @param {Array<KT>} keys
 * @param {VT} value
 * @returns {(Object.<KT, VT> | Map.<KT, VT>)}
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
