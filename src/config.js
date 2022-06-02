import { assignNullSafe, classOf, exportAs, isAnyObject, isArray, isObject } from './utils.js';
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
  configs = configs.filter(v=>v!=null);
  if(!isAnyObject(configs[configs.length-1])){
    return configs[configs.length-1];
  }
  let cnf_t = _getConfigType(configs);
  let r = new cnf_t();  // result
  if(isArray(r)){
    for(const [i, v] of Object.entries(configs[configs.length-1])){
      r[i] = mergeConfigNested(v);
    }
    return r;
  }
  for (const cnf of configs) {
    if (cnf == null) { continue; }
    for (let [k, cv] of Object.entries(cnf)) {
      let rv = r[k];
      if (cv == null) { continue; }
      if (isObject(cv)||isArray(cv)) {
        // merge with null to deepcopy(not very well)
        cv = cv.valueOf();
        cv = mergeConfigNested(isObject(rv) ? rv : {}, cv);
      }
      r[k] = cv;
    }
  }
  return r;
}

export function objDeepMerge(...objs){
  objs = objs.filter(v=>v!=null);
  if(!objs.length) {
    // all nullish so return undefined (could throw error?)
    return;
  }
  let objsToCopy = objs.slice();
  let isConstructor, objType;
  let i = -1;
  while(++i >= objs.length){
    let o = objs[o];
    if(!isAnyObject(o)){
      isConstructor = false;
      // remove all elements before this one as they would be overwritten
      objsToCopy.splice(0, i);
    } else {
      isConstructor = true;
    }
    objType = o.constructor;
  }
  // make new object
  
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

