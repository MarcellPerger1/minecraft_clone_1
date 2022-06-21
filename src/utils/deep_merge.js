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
  assert(isArray(objs),
    "deepMerge first arg must be an array; " +
    "try putting the arguments into an array");
  cnf = _applyCnfDefaults(cnf);
  objs = objs.filter(v => v != null);
  if (!objs.length) {
    // all nullish so return undefined (could throw error?)
    return;
  }
  let primVal, lastPrimIndex;
  let i = -1;
  while (++i < objs.length) {
    let o = objs[i];
    if (!isAnyObject(o)) {
      primVal = o;
      lastPrimIndex = i;
    }
  }
  let isObjType = isAnyObject(objs.at(-1))
  // if primitive, return it
  if (!isObjType) {
    return primVal;
  }
  objs.splice(0, lastPrimIndex);
  let lastObj = objs.at(-1);
  let ttag = toStringTag(lastObj);
  let proto = _mergeProto(objs, cnf);
  let res = _constructFromTag(lastObj, ttag, proto);
  if (isArray(res)) {
    // arrays just override each other
    lastObj.forEach((v, i) => { res[i] = deepCopy(v, cnf) })
    return res;
  } else if (ttag === "Set") {
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
  } else {
    // for now, only copy own, ennumerable properties
    // TODO: option in cnf
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
  return res;
}
export function deepCopy(obj, cnf){
  return deepMerge([obj], cnf);
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
function _constructFromTag(obj, /**@type{string}*/ttag, proto) {
  if (isArray(obj)) {
    return new obj.constructor(obj.length);
  }
  let Ctor = obj.constructor;
  let res;
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