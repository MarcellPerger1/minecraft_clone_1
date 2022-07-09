// this module is heavily inspired by lodash's cloneDeep
// but adapted to make it more readable
// and to support merging, not just cloning

import { assert } from './assert.js';
import { findTypeProto, getOwnProperties } from './object_utils.js';
import { isAnyObject, isArray, toStringTag } from './type_check.js';


// EXPORTS
Symbol.dontMerge = Symbol.for("dontMerge");

// typedefs
/**
 * @typedef {Object} deepMergeCnfT
 * @prop {Array<*>} [cnf.weakObjTypes=[Object]]
 * @prop {*} [cnf.protoOverride] override constructor of result
 * @prop {*} [cnf.ctorOverride] override prototype of result
 * @prop {boolean} [cnf.deepSetItems] copy items in Set?
*/

// public functions
/**
 * deep copy and merge some objects
 * @param {Array<*>} objs - Objects to deepmerge
 * @param {deepMergeCnfT} [cnf] - Config
 * @param {Array<*>} [cnf.weakObjTypes=[Object]]
 * @param {*} [cnf.protoOverride] override constructor of result
 * @param {*} [cnf.ctorOverride] override prototype of result
 * @param {boolean} [cnf.deepSetItems] copy items in Set?
 * @returns {*}
*/
export function deepMerge(objs, cnf = null) {
  cnf = _applyCnfDefaults(cnf);
  let objs_arg = objs;
  objs = _filterObjs(objs);
  if (!objs.length) {
    return objs_arg.at(-1); // all nullish so return last arg (could throw error?)
  }
  if (!isAnyObject(objs.at(-1))) {
    return objs.at(-1); // primitive so just return it
  }
  _trimObjsList(objs, cnf);
  let res = _construct(objs, cnf);
  _setstate(res, objs, cnf);
  return res;
}
export function deepCopy(obj, cnf){
  return deepMerge([obj], cnf);
}


// INTERNALS
// arg processing
function _applyCnfDefaults(cnf){
  cnf ??= {};
  cnf.weakObjTypes ??= [Object];
  return cnf;
}

function _filterObjs(objs){
  assert(isArray(objs),
    "deepMerge first arg must be an array; " +
    "try putting the arguments into an array");
  objs = objs.filter(v => v != null);
  return objs;
}
function _trimObjsList(objs, _cnf){
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


// construct
function _construct(objs, cnf){
  let proto = _mergeProto(objs, cnf);
  let res = _construct.fromTag(objs.at(-1), proto);
  return res;
}
_construct.fromTag = function constructFromTag(obj, proto) {
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
      return _construct.object(obj, proto);
    case 'Function':
      return obj;
  }
  if (ttag.startsWith('HTML')) {
    return obj;
  }
  throw new TypeError(`Don't know how to merge ${ttag} objects`);
}
_construct.object = function constructObject(obj, proto) {
  if (typeof obj.constructor !== 'function') {
    return {};
  }
  return Object.create(proto);
}


// setstate
/**
 * Internal, set state on `res` from `objs`
 * @param {object} res
 * @param {object[]} objs
 * @param {object} cnf
*/
function _setstate(res, objs, cnf){
  if(_dontMerge(objs)) {
    objs.splice(0, objs.length - 1);
  }
  let ttag = toStringTag(res);
  if (isArray(res)) {
    _setstate.array(res, objs, cnf);
  } else if (ttag === "Set") {
    _setstate.setlike(res, objs, cnf);
  } else {
    _setstate.object(res, objs, cnf);
  }
  return res;
}
_setstate.object = function setstate_object(res, objs, cnf){
  // for now, copy all own properties
  // TODO: option in cnf
  let ttag = toStringTag(res);
  // dont pollute with Object methods
  let update_with = Object.create(null);
  for (let o of objs) {
    getOwnProperties(o).forEach(k => (update_with[k] ??= []).push(
      ttag==="Map" ? o.get(k) : o[k]));
  }
  for (let k of getOwnProperties(update_with)) {
    let v = deepMerge(update_with[k], cnf);
    if(ttag==="Map") { res.set(k, v); } else { res[k] = v; }
  }
}
_setstate.maplike = _setstate.object
_setstate.setlike = function setstate_setlike(res, objs, cnf){
  for (let o of objs) {
    switch (toStringTag(o)){
      case "Set":
        o.forEach((_v, k) => res.add(_maybeCopy.setItem(k, cnf)));
        break;
      case "Map":
        o.forEach((v, k) => v ? res.add(_maybeCopy.setItem(k, cnf)) : res);
        break;
    }
    Object.keys(o).forEach(k => {
      if (o[k] === undefined) { return; }
      if (o[k]) { res.add(k); } else { res.remove(k); }
    });
  }
}
_setstate.array = function setstate_array(res, objs, cnf){
  objs.at(-1).forEach((v, i) => { res[i] = deepCopy(v, cnf) })
}

function _dontMerge(objs){
  let dontMerge = undefined;
  for (let o of objs){
    dontMerge = o?.[Symbol.dontMerge] ?? dontMerge;
  }
  return dontMerge;
}

function _maybeCopy(v, cond, cnf){
  return cond ? deepCopy(v, cnf) : v;
}
// item *in* set
_maybeCopy.setItem = function _copySetItem(si, cnf){
  return _maybeCopy(si, cnf.deepSetItems, cnf);
}


// protoype handling
function _mergeProto(objs, cnf) {
  // null is a vaild prototype so use '!== undefined'
  if (cnf.protoOverride !== undefined) {
    return cnf.protoOverride;
  }
  // use '!= null' because null is not a vaild constructor
  if (cnf.ctorOverride != null) {
    return cnf.ctorOverride.prototype;
  }

  let weakObjProtos = cnf.weakObjTypes.map(findTypeProto);
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
