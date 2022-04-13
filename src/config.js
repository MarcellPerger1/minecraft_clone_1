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
  checkError;

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
  grassTopPath: "./textures/grass_top.min.png",
  grassSidePath: "./textures/grass_side.min.png",
  grassBottomPath: "./textures/grass_bottom.min.png",
  startPos: [0.5, 2.5, -5],
  startRot: {h: 0, v: 0},
  speed: 3.5,
  sensitivity: 0.7,
  vRotMin: -80,
  vRotMax: 80,
  // because gl.getError has HUGE impacts on performance
  // and chrome dev tools reports it anyway
  checkError: false,  
});

// textures from:
// https://sketchfab.com/3d-models/minecraft-grass-block-84938a8f3f8d4a0aa64aaa9c4e4d27d3

exportAs(Config);
