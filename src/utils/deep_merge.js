import { assert } from './assert.js';
import { isAnyObject, isArray, toStringTag } from './type_check.js';

// this module is heavily inspired by lodash's cloneDeep
// but adapted to make it more readable
// and to support merging, not just cloning


/**
* deep copy and merge some objects
* @param {Array<*>} objs - Objects to deepmerge
* @param {Object} [cnf] - Config
* @param {Array<*>} [cnf.weakObjTypes=[Object]]
* @param {*} [cnf.protoOverride] override constructor of result
* @param {*} [cnf.ctorOverride] override prototype of result
* @param {boolean} [cnf.deepSetItems] copy items in Set?
* @returns {*}
*/
export function deepMerge(objs, cnf = null) {
  cnf = _applyCnfDefaults(cnf);
  objs = _filterObjs(objs);
  if (!objs.length) {
    return; // all nullish so return undefined (could throw error?)
  }
  if (!isAnyObject(objs.at(-1))) {
    return objs.at(-1); // primitive so just return it
  }
  _trimObjsBeforePrimitive(objs);
  let res = _construct(objs, cnf);
  _setstate(res, objs, cnf);
  return res;
}
export function deepCopy(obj, cnf){
  return deepMerge([obj], cnf);
}

function _filterObjs(objs){
  assert(isArray(objs),
    "deepMerge first arg must be an array; " +
    "try putting the arguments into an array");
  objs = objs.filter(v => v != null);
  return objs;
}

// inplace
function _trimObjsBeforePrimitive(objs){
  let lastPrimIndex;
  let i = -1;
  while (++i < objs.length) {
    let o = objs[i];
    if (!isAnyObject(o)) {
      lastPrimIndex = i;
    }
  }
  objs.splice(0, lastPrimIndex);
}

function _construct(objs, cnf){
  let proto = _mergeProto(objs, cnf);
  let res = _constructFromTag(objs.at(-1), proto);
  return res;
}

function _setstate(res, objs, cnf){
  let ttag = toStringTag(res);
  if (isArray(res)) {
    _setstateArray(res, objs, cnf);
  } else if (ttag === "Set") {
    _setstateSetlike(res, objs, cnf);
  } else {
    _setstateObject(res, objs, cnf);
  }
  return res;
}

// or Map-like
function _setstateObject(res, objs, cnf){
  // for now, only copy own, ennumerable properties
  // TODO: option in cnf
  let ttag = toStringTag(res);
  let update_with = {};
  for (let o of objs) {
    Object.keys(o).forEach(k => (update_with[k] ??= []).push(
      ttag==="Map" ? o.get(k) : o[k]));
  }
  for (let [k, vs] of Object.entries(update_with)) {
    let v = deepMerge(vs, cnf);
    if(ttag==="Map") { res.set(k, v); } else { res[k] = v; }
  }
}
function _setstateSetlike(res, objs, cnf){
  for (let o of objs) {
    switch (toStringTag(o)){
      case "Set":
        o.forEach((_v, k) => res.add(_copySetItem(k, cnf)));
        break;
      case "Map":
        o.forEach((v, k) => v ? res.add(_copySetItem(k, cnf)) : res);
        break;
    }
    Object.keys(o).forEach(k => {
      if (o[k] === undefined) { return; }
      if (o[k]) { res.add(k); } else { res.remove(k); }
    });
  }
}
function _setstateArray(res, objs, cnf){
  objs.at(-1).forEach((v, i) => { res[i] = deepCopy(v, cnf) })
}

function _applyCnfDefaults(cnf){
  cnf ??= {};
  cnf.weakObjTypes ??= [Object];
  return cnf;
}

function _maybeCopy(v, cond, cnf){
  return cond ? deepCopy(v, cnf) : v;
}
function _copySetItem(si, cnf){
  return _maybeCopy(si, cnf.deepSetItems, cnf);
}

// Importtant: undefined means detect prototype, null means null as prototype
function _constructFromTag(obj, proto) {
  if (isArray(obj)) {
    return new obj.constructor(obj.length);
  }
  let Ctor = obj.constructor;
  let res;
  let ttag = toStringTag(obj);
  switch (ttag) {
    case 'Number':
    case 'String':
    case 'Boolean':
    case 'Date':
      return new Ctor(obj);
    case 'Map':
    case 'Set':
      return new Ctor();
    case 'Symbol':
      return Object(Symbol.prototype.valueOf.call(obj));
    case 'RegExp':
      res = new obj.constructor(obj.source, obj.flags);
      res.lastIndex = obj.lastIndex;
      return res;
    case 'Object':
      return _constructObject(obj, proto);
    case 'Function':
      return obj;
  }
  if (ttag.startsWith('HTML')) {
    return obj;
  }
  throw new TypeError(`Don't know how to merge ${ttag} objects`);
}

function _constructObject(obj, proto = undefined) {
  // if (protoOverride !== undefined) {
  //     return Object.create(protoOverride);
  //   }
  // TODO or isPrototype()
  if (typeof obj.constructor !== 'function') {
    return {};
  }
  // let proto = Object.getPrototypeOf(obj)
  return Object.create(proto);
}

function _mergeProto(objs, cnf) {
  // null is a vaild prototype so use '!== undefined'
  if (cnf.protoOverride !== undefined) {
    return cnf.protoOverride;
  }
  // use '!= undefined' because null is not a vaild constructor
  if (cnf.ctorOverride != undefined) {
    return cnf.ctorOverride.prototype;
  }

  let weakObjProtos = cnf.weakObjTypes.map(_getProtoFor);
  // if only weak protos, use last proto
  let proto = Object.getPrototypeOf(objs.at(-1));

  // iterate backwards
  let i = objs.length;
  while (i-- > 0) {
    let p = Object.getPrototypeOf(objs[i]);
    if (!weakObjProtos.includes(p)) {
      // if encounter non-weak, will override all before so break
      proto = p;
      break;
    }
  }
  return proto;
}

/**
 * Return prototype for ctor or proto
 * @param {*} p - Prototype or constructor
 * @returns {*}  The prototype
*/
function _getProtoFor(p) {
  if (_isPrototype(p)) { return p; }
  if (typeof p === 'function' && p.prototype !== undefined) {
    return p.prototype;
  }
  // assert(typeof p === 'object')
  return p;
}

function _isPrototype(value) {
  return value
    && typeof value.constructor === 'function'
    && value.constructor.prototype === value
}