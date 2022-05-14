import { assignNullSafe, classOf, exportAs, isArray, isObject } from './utils.js';
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
GenerationConfig.DEFAULT = new GenerationConfig({
  seed: 'secret-seed',
  isTestWorld: false,
  nScale: [11.14, 2, 11.14],
  wSize: [16, 16, 16],
});


/**
 * Controls Configs
 * @typedef {Object} ControlsConfigT
 * @property {number} sensitivity
 * @property {[number, number]} vRotRange
 * @property {Vec2} maxMouseMove
 */
export class ControlsConfig extends BaseConfig { }
ControlsConfig.DEFAULT = new ControlsConfig({
  sensitivity: 0.5,
  vRotRange: [-80, 80],
  maxMouseMove: [Infinity, Infinity],
})


/**
 * Player Configs
 * @typedef {Object} PlayerConfigT
 * @property {Vec3} startPos
 * @property {Rot3} startRot
 * @property {number} speed
*/
export class PlayerConfig extends BaseConfig { }
PlayerConfig.DEFAULT = new PlayerConfig({
  startPos: [0.5, 5.5, -5],
  startRot: { h: 0, v: 0 },
  speed: 3.5,
});


/**
 * Shader Configs
 * @typedef {Object} ShaderConfigT
 * @property {path} vsPath
 * @property {path} fsPath
*/
export class ShaderConfig extends BaseConfig { }
ShaderConfig.DEFAULT = new ShaderConfig({
  vsPath: "./shaders/vertex-shader.glsl",
  fsPath: "./shaders/fragment-shader.glsl",
})


/**
 * Atlas Configs
 * @typedef {Object} AtlasConfigT
 * @property {path} imgPath
 * @property {path} indexPath
*/
export class AtlasConfig extends BaseConfig { }
AtlasConfig.DEFAULT = new AtlasConfig({
  imgPath: "./res/atlas.png",
  indexPath: "./res/atlas-index.json",
})


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
Config.DEFAULT = new Config({
  bgColor: [0.5, 0.86, 1.0, 1.0],
  // because gl.getError has HUGE impacts on performance
  // and chrome dev tools reports it anyway
  checkError: false,
  generation: GenerationConfig.DEFAULT,
  controls: ControlsConfig.DEFAULT,
  player: PlayerConfig.DEFAULT,
  shader: ShaderConfig.DEFAULT,
  atlas: AtlasConfig.DEFAULT,
});




export function mergeConfigNested(...configs) {
  let cnf_t = _getConfigType(configs);
  let r = new cnf_t();
  for (const cnf of configs) {
    if (cnf == null) { continue; }
    for (let [k, cv] of Object.entries(cnf)) {
      let rv = r[k];
      if (cv == null) { continue; }
      if (isObject(cv)) {
        // merge with {} to deepcopy(not very well)
        cv = cv.valueOf();
        cv = mergeConfigNested(isObject(rv) ? rv : {}, cv);
      }
      if (isArray(cv)) {
        cv = cv.slice(); // shallow copy for now
      }
      r[k] = cv;
    }
  }
  return r;
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

