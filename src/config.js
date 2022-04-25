import { classOf, exportAs, assignNullSafe, isObject, isPrimitive } from './utils.js';

// TODO nested config classes/objects
export class Config {
  /**
   * The default config
   * @type {Config}
   */
  static DEFAULT;
  // filepaths
  vsPath;
  fsPath;
  atlasImg;
  atlasIndex;
  // rendering consts
  bgColor;
  startPos;
  startRot;
  // movement consts
  speed;
  // mouse consts
  sensitivity;
  vRotMin;
  vRotMax;
  maxMouseMove;
  checkError;
  // world generation
  seed;
  isTestWorld;

  constructor(cnf = {}, ...args) {
    assignNullSafe(this, classOf(this).DEFAULT, cnf ?? {}, ...args);
  }

  getWithDefaults() {
    // allows overriding default in subclasses
    return new classOf(this)(classOf(this).DEFAULT, this);
  }
}


Config.DEFAULT = new Config({
  bgColor: [0.5, 0.86, 1.0, 1.0],
  vsPath: "./shaders/vertex-shader.glsl",
  fsPath: "./shaders/fragment-shader.glsl",
  atlasImg: "./textures/atlas.png",
  atlasIndex: "./textures/atlas-index.json",
  startPos: [0.5, 5.5, -5],
  startRot: { h: 0, v: 0 },
  speed: 3.5,
  sensitivity: 0.5,
  vRotMin: -80,
  vRotMax: 80,
  maxMouseMove: [Infinity, Infinity],
  // because gl.getError has HUGE impacts on performance
  // and chrome dev tools reports it anyway
  checkError: false,
  seed: 'secret-seed',
  isTestWorld: false,
});


export function mergeConfigNested(...configs) {
  let cnf_t = configs.reduceRight(
    (prev, cnf) => prev === Object ? cnf.constructor: prev, Object);
  let r = new cnf_t();
  for(const cnf of configs){
    for(let [k, cv] of Object.entries(cnf)){
      let rv = r[k];
      if(cv==null) { continue; }
      if(isObject(cv)){
        // merge with nothing to deepcopy(not very well)
        cv = mergeConfigNested(isObject(rv) ? rv : {}, cv);
      }
      r[k] = cv;
    }
  }
  return r;
}

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
