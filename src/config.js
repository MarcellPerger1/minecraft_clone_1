import { assignNullSafe, classOf, exportAs, getTypeTag, isAnyObject, isArray, isObject, removePrefix } from './utils.js';
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
    assignNullSafe(this, mergeConfigNested(...configs, _CONSTRUCTOR_OVERRIDES));
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
  if (!isAnyObject(configs[configs.length - 1])) {
    return configs[configs.length - 1];
  }
  let cnf_t = _getConfigType(configs);
  let r = new cnf_t();  // result
  if (isArray(r)) {
    for (const [i, v] of Object.entries(configs[configs.length - 1])) {
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
* @returns {*}
*/
export function objDeepMerge(objs, cnf) {
  objs = objs.filter(v => v != null);
  if (!objs.length) {
    // all nullish so return undefined (could throw error?)
    return;
  }
  let isObjType, primVal, lastPrimIndex;
  let i = -1;
  while (++i < objs.length) {
    let o = objs[i];
    if (!isAnyObject(o)) {
      primVal = o;
      lastPrimIndex = i;
    }
  }
  // make new object
  // if primitive, return it
  if (!isObjType) {
    return primVal;
  }
  objs = objs.splice(0, lastPrimIndex);
  let lastObj = objs[objs.length - 1];
  let ttag = getTypeTag(lastObj);
  let res = _constructFromTag(ttag);
  if(isArray(res)){
    // arrays just override each other
    lastObj.forEach((v, i) => {res[i] = objDeepMerge([v])})
    return res;
  } else {
    // for now, only copy ennumerable properties
    // TODO: option in cnf
    
  }
}

// NOTE: 0 is used as the default for `protoOverride`
// becausae prototypes have to be Object or mull
// therefore can't use null as default and 
// i would rather not get into the null/undefined stuff
// so just use something that could never be valid as a prototype
// ie. not null or Object.
// therefore just use any primitive (0 in this case)
function _constructFromTag(obj, /**@type{string}*/ttag, protoOverride=0) {
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
      return new Ctor();
    case 'Symbol':
      return Object(Symbol.prototype.valueOf.call(obj));
    case 'RegExp':
      res = new obj.constructor(obj.source, obj.flags);
      res.lastIndex = obj.lastIndex;
      return res;
    case 'Object':
      if(typeof res.constructor !== 'function'){
        return {};
      }
      let proto = protoOverride===0
        ? Object.getPrototypeOf(obj)
        : protoOverride;
      return Object.create(proto);
    default:
      throw new TypeError(`Don't know how to merge ${ttag} objects`);
  }
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
  return mergeConfigNested(config, ...extra);
}


exportAs(Config);

