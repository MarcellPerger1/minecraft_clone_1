import {classOf, exportAs} from '../utils.js';

export class RendererConfig {
  static DEFAULT = undefined;
  // fields
  bgColor;
  vsPath;
  fsPath;
  grassTopPath;
  grassSidePath;
  grassBottomPath;
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
  grassTopPath: "./textures/grass-top.jpg",
  grassSidePath: "./textures/grass-side.jpg",
  grassBottomPath: "./textures/grass-bottom.png",
  camPos: [0.0, 0.0, -4.0],
});

exportAs(RendererConfig);
