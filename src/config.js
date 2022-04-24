import {classOf, exportAs, assignNullSafe} from './utils.js';

// TODO nested config classes/objects
export class Config {
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
  startRot: {h: 0, v: 0},
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


exportAs(Config);
