import { assignNullSafe, classOf, exportAs, getTypeTag, isAnyObject, isArray, isObject, removePrefix, removeSuffix } from './utils.js';
import { loadConfigFile } from "./config_loader.js";


Symbol.isConfig = Symbol.for('isConfig');
Symbol.overrideType = Symbol.for('overrideType');

const _CONSTRUCTOR_OVERRIDES = {
  [Symbol.overrideType]: Object,
  [Symbol.isConfig]: true
};
export class BaseConfig {
  static DEFAULT;

  constructor(...configs) {
    assignNullSafe(this, objDeepMerge([...configs]));
    // , _CONSTRUCTOR_OVERRIDES
  }

  getWithDefaults() {
    // allows overriding default in subclasses
    return new classOf(this)(classOf(this).DEFAULT, this);
  }
}
BaseConfig[Symbol.isConfig] = true;


/**
 * @typedef {string} path
 * @typedef {[number, number, number, number]} RGBA_Tuple
 * @typedef {[number, number number]} Vec3
 * @typedef {[number, number]} Vec2
 * @typedef {(number|string)} SeedType
 * @typedef {{h: number, v: number}} Rot3
*/



/**
 * World Generation Configs
 * @typedef {Object} GenerationConfigT
 * @property {SeedType} seed
 * @property {boolean} isTestWorld
 * @property {Vec3} nScale
 * @property {Vec3} wSize
*/
export class GenerationConfig extends BaseConfig { }


/**
 * Controls Configs
 * @typedef {Object} ControlsConfigT
 * @property {number} sensitivity
 * @property {[number, number]} vRotRange
 * @property {Vec2} maxMouseMove
 */
export class ControlsConfig extends BaseConfig { }


/**
 * Player Configs
 * @typedef {Object} PlayerConfigT
 * @property {Vec3} startPos
 * @property {Rot3} startRot
 * @property {number} speed
*/
export class PlayerConfig extends BaseConfig { }


/**
 * Shader Configs
 * @typedef {Object} ShaderConfigT
 * @property {path} vsPath
 * @property {path} fsPath
*/
export class ShaderConfig extends BaseConfig { }


/**
 * Atlas Configs
 * @typedef {Object} AtlasConfigT
 * @property {Path} imgPath
 * @property {Path} indexPath
*/
export class AtlasConfig extends BaseConfig { }


/**
 * Root Config object
 * @typedef {Object} ConfigT
 * @property {RGBA_Tuple} bgColor
 * @property {boolean} checkError
 * @property {GenerationConfigT} generation
 * @property {ControlsConfigT} controls
 * @property {PlayerConfigT} player
 * @property {ShaderConfigT} shader
 * @property {AtlasConfigT} atlas
 * @property {function():ConfigT} getWithDefaults
*/
export class Config extends BaseConfig { }



// todo this is super dirty!
export function mergeConfigNested(...configs) {
  configs = configs.filter(v => v != null);
  if (!isAnyObject(configs.at(-1))) {
    return configs.at(-1);
  }
  let cnf_t = _getConfigType(configs);
  let r = new cnf_t();  // result
  if (isArray(r)) {
    for (const [i, v] of Object.entries(configs.at(-1))) {
      r[i] = mergeConfigNested(v);
    }
    return r;
  }
  for (const cnf of configs) {
    if (cnf == null) { continue; }
    for (let [k, cv] of Object.entries(cnf)) {
      let rv = r[k];
      if (cv == null) { continue; }
      if (isObject(cv) || isArray(cv)) {
        // merge with null to deepcopy(not very well)
        cv = cv.valueOf();
        cv = mergeConfigNested(isObject(rv) ? rv : {}, cv);
      }
      r[k] = cv;
    }
  }
  return r;
}

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
      return new Ctor();
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


function _getConfigType(configs) {
  let cnf_t = Object;
  for (const cnf of configs) {
    if (cnf?.[Symbol.overrideType] != null) {
      cnf_t = cnf[Symbol.overrideType];
    } else {
      if ((cnf?.constructor ?? Object) !== Object) {
        cnf_t = cnf.constructor;
      }
    }
  }
  return cnf_t;
}

export function _shouldDeepMerge(v) {
  if (v?.[Symbol.isConfig]) {
    return true;
  }
  return false;
}

/**
 * Get `Config` to use
 * @param {...(ConfigT)} extra - Extra Configs to merge
 * @returns {Promise<ConfigT>} The `Config` to use
 */
export async function getConfig(...extra) {
  let config = await loadConfigFile("./configs/config.json");
  return objDeepMerge([config, ...extra]);
}


exportAs(Config);

