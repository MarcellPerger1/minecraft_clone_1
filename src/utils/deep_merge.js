import { assignNullSafe, classOf, exportAs, getTypeTag, isAnyObject, isArray, isObject, removePrefix, removeSuffix } from '../utils.js';


/**
* deep copy and merge some objects
* @param {Array<*>} objs - Objects to deepmerge
* @param {Object} cnf - Config
* @param {Array<*>} [cnf.weakObjTypes=[Object]]
* @param {*} [cnf.protoOverride]
* @param {*} [cnf.ctorOverride]
* @returns {*}
*/
export function objDeepMerge(objs, cnf) {
  cnf ??= {};
  // TODO use weakObjTypes - protos or ctors / detect=how??
  // dewtection: typeof ctor == function
  // typeof proto == 'object'
  cnf.weakObjTypes ??= [Object];  
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
  let ttag = getTypeTag(lastObj);
  let proto = _mergeProto(objs, cnf);
  let res = _constructFromTag(lastObj, ttag, proto);
  if (isArray(res)) {
    // arrays just override each other
    lastObj.forEach((v, i) => { res[i] = objDeepMerge([v]) })
    return res;
  } else {
    // for now, only copy ennumerable properties
    // TODO: option in cnf
    let update_with = {};
    for (let o of objs) {
      Object.keys(o).forEach(k => (update_with[k] ??= []).push(o[k]));
    }
    for(let [k, vs] of Object.entries(update_with)){
      res[k] = objDeepMerge(vs, cnf);
    }
  }
  return res;
}

// Importtant: undefined means detect prototype, null means null as prototype
function _constructFromTag(obj, /**@type{string}*/ttag, proto) {
  if (isArray(obj)) {
    return new obj.constructor(obj.length);
  }
  let Ctor = obj.constructor;
  ttag = removeSuffix(removePrefix(ttag, '[object '), ']');
  let res;
  switch (ttag) {
    case 'Number':
    case 'String':
    case 'Boolean':
    case 'Date':
      return new Ctor(obj);
    case 'Map':
    case 'Set':
      throw new TypeError("Map and Set are not supported yet");
      // return new Ctor();
    case 'Symbol':
      return Object(Symbol.prototype.valueOf.call(obj));
    case 'RegExp':
      res = new obj.constructor(obj.source, obj.flags);
      res.lastIndex = obj.lastIndex;
      return res;
    case 'Object':
      return _constructObject(obj, proto);
    default:
      throw new TypeError(`Don't know how to merge ${ttag} objects`);
  }
}

function _constructObject(obj, proto=undefined){
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

function _mergeProto(objs, cnf){
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
  while(i --> 0){
    let p = Object.getPrototypeOf(objs[i]);
    if(!weakObjProtos.includes(p)){
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
function _getProtoFor(p){
  if(_isPrototype(p)){ return p; }
  if(typeof p === 'function' && p.prototype!==undefined){
    return p.prototype;
  }
  // assert(typeof p === 'object')
  return p;
}

function _isPrototype(value){
  // if(!value){
  //   return false;
  // } 
  // if(typeof value.constructor !== 'function'){
  //   return false;
  // }
  // return value === value.constructor.prototype;
  // rephrased:
  return value 
    && typeof value.constructor === 'function' 
    && value.constructor.prototype === value
}