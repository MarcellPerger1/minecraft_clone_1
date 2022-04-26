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
 * @property {number} vRotMin
 * @property {number} vRotMax
 * @property {Vec2} maxMouseMove
 */
export class ControlsConfig extends BaseConfig { }
ControlsConfig.DEFAULT = new ControlsConfig({
  sensitivity: 0.5,
  // TODO merge these
  vRotMin: -80,
  vRotMax: 80,
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

/**
 * @typedef {string} path
 * @typedef {[number, number, number, number]} RGBA_Tuple
 * @typedef {[number, number number]} Vec3
 * @typedef {[number, number]} Vec2
 * @typedef {(number|string)} SeedType
 * @typedef {{h: number, v: number}} Rot3
*/

// export function updateConfigNested(a, b) {
//   if (b == null) { return a; }
//   for (const [k, av] of Object.entries(a)) {
//     let bv = b[k];
//     if (bv == null) {
//       continue;
//     }
//     if (av == null) {
//       // todo copy the values from bv, not just assign
//       a[k] = bv;
//       continue;
//     }
//     if (!isObject(av)) {
//       // not an object so dont need to recurse into av
//       if (isObject(bv)) {
//         // todo copy the values from bv, not just assign
//         bv = bv;
//       }
//       a[k] = bv;
//       continue;
//     }
//     // assert(isObject(av));
//     if (!isObject(bv)) {
//       // just assign (TODO: deepcopy?)
//       a[k] = bv;
//       continue;
//     }
//     // assert(isObject(av) && isObject(bv));
//     updateConfigNested(av, bv);
//   }
//   return a;
// }

// export function deepcopyConfig(cnf, opts=null, memo=new Map()){
//   setProto = opts?.setProto ?? true;
//   // dont use memo for primitives
//   if(isPrimitive(cnf)){
//     return cnf;
//   }
//   if(memo.has(cnf)){
//     return memo.get(cnf);
//   }
//   let r;
//   if(isArray(cnf)){
//     r = cnf.map(v => deepcopyConfig(v, memo));
//   }
//   if(isObject(cnf)){
//     r = Object.fromEntries(
//       Object.entries(cnf).map(
//         ([k, v]) => [deepcopyConfig(k, memo), deepcopyConfig(v, memo)]
//       )
//     );
//     if(setProto){
//       Object.setPrototypeOf(r, Object.getPrototypeOf(cnf));
//     }
//   }
//   memo.set(cnf, r);
//   return r;
// }


exportAs(Config);

