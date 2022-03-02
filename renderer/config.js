import {classOf, exportAs} from './utils.js';

export class RendererConfig {
  static DEFAULT = undefined;
  // fields
  bgColor;
  vsPath;
  fsPath;
  grassTopPath;
  grassSidePath;
  rotate;
  cubePos;
  camPos;

  constructor(cnf = {}, ...args) {
    cnf = cnf != undefined ? cnf : {};
    Object.assign(this, classOf(this).DEFAULT, cnf, ...args);
  }
  getWithDefaults() {
    // allows overriding default in subclasses
    return new RendererConfig(classOf(this).DEFAULT, this);
  }
}


RendererConfig.DEFAULT = new RendererConfig({
  bgColor: [0.5, 0.86, 1.0, 1.0],
  vsPath: "./shaders/vertex-shader.glsl",
  fsPath: "./shaders/fragment-shader.glsl",
  grassTopPath: "./textures/grass-top-5.jpg",
  grassSidePath: "./textures/grass-side-5.jpg",
  rotate: false,
  cubePos: [0.0, 2.4, 10.0],
  camPos: [0.0, 0.0, 0.0],
});

exportAs(RendererConfig);
