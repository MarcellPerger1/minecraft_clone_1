/**
 * Return prototype for ctor or proto
 * @param {*} p - Prototype or constructor
 * @returns {*}  The prototype
*/
export function findTypeProto(p) {
  if (isPrototype(p)) { return p; }
  if (typeof p === 'function' && p.prototype !== undefined) {
    return p.prototype;
  }
  // assert(typeof p === 'object')
  return p;
}

export function isPrototype(value) {
  return value
    && typeof value.constructor === 'function'
    && value.constructor.prototype === value
}