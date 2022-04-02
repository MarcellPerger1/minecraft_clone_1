import {classOf, exportAs, assignNullSafe} from './utils.js';

// TODO nested config classes/objects
export class Config {
  static DEFAULT;
  // filepaths
  vsPath;
  fsPath;
  grassTopPath;
  grassSidePath;
  grassBottomPath;
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
  debug;

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
  grassTopPath: "./textures/grass-top.jpg",
  grassSidePath: "./textures/grass-side.jpg",
  grassBottomPath: "./textures/grass-bottom.png",
  startPos: [0, 0, -4],
  startRot: {h: 0, v: 0},
  speed: 3.5,
  sensitivity: 0.7,
  vRotMin: -80,
  vRotMax: 80,
  debug: true,
});

exportAs(Config);
