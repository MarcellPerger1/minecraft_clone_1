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

/**
 * Return prototype for ctor or proto
 * @param {*} p - Prototype or constructor
 * @returns {*}  The prototype
 */
export function findTypeProto(p) {
  if (isPrototype(p)) {
    return p;
  }
  if (typeof p === "function" && p.prototype !== undefined) {
    return p.prototype;
  }
  // assert(typeof p === 'object')
  return p;
}

export function isPrototype(value) {
  return (
    value &&
    typeof value.constructor === "function" &&
    value.constructor.prototype === value
  );
}

/**
 * Retuns all own symbol and string property keys on `obj`
 * @param {object} obj
 * @returns {(string | symbol)[]}
 */
export function getOwnProperties(obj) {
  return Object.getOwnPropertyNames(obj).concat(
    Object.getOwnPropertySymbols(obj)
  );
}
