import {classOf, exportAs} from '../utils.js';

// TODO nested config classes/objects
export class Config {
  static DEFAULT = undefined;
  // filepaths
  vsPath;
  fsPath;
  grassTopPath;
  grassSidePath;
  grassBottomPath;
  // rendering consts
  bgColor;
  camPos;
  // movement consts
  speed;
  sensitivity;

  constructor(cnf = {}, ...args) {
    cnf ??= {};
    Object.assign(this, classOf(this).DEFAULT, cnf, ...args);
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
  camPos: [0.0, 0.0, -4.0],
  speed: 3.5,
  sensitivity: 0.7,
});

exportAs(Config);
