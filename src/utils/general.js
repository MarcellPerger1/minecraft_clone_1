import { isFunction } from "./type_check.js";
import { assert } from "./assert.js";

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
