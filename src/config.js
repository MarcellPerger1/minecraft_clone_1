import { classOf, exportAs, isObject } from './utils.js';


Symbol.isConfig = Symbol.for('isConfig');
Symbol.overrideType = Symbol.for('overrideType');

export class BaseConfig {
  static DEFAULT;
  
  constructor(cnf = {}, ...args) {
    Object.assign(this, mergeConfigNested(
      classOf(this).DEFAULT, cnf, ...args,
      {[Symbol.overrideType]: Object, [Symbol.isConfig]: true}));
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
*/
export class GenerationConfig extends BaseConfig { }
GenerationConfig.DEFAULT = new GenerationConfig({
  seed: 'secret-seed', 
  isTestWorld: false
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
  imgPath: "./textures/atlas.png",
  indexPath: "./textures/atlas-index.json",
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
  let cnf_t = Object;
  for(const cnf of configs){
    if(cnf?.[Symbol.overrideType]!=null){
      cnf_t = cnf[Symbol.overrideType];
    } else {
      if(cnf?.constructor ?? Object !== Object){
        cnf_t = cnf.constructor;
      }
    }
  }
  let r = new cnf_t();
  for(const cnf of configs){
    if(cnf==null){continue;}
    for(let [k, cv] of Object.entries(cnf)){
      let rv = r[k];
      if(cv==null) { continue; }
      if(isObject(cv)){
        // merge with {} to deepcopy(not very well)
        cv = mergeConfigNested(isObject(rv) ? rv : {}, cv);
      }
      r[k] = cv;
    }
  }
  return r;
}

export function _doDeepMerge(v){
  if(v?.[Symbol.isConfig]){
    return true;
  }
  return false;
}




exportAs(Config);

