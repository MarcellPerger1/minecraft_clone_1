import { fetchTextFile } from "../utils/file_load.js";
import { loadShader, programFromShaders } from "../utils/gl_utils.js";
import { assert } from "../utils/assert.js";

import { GameComponent } from "../game_component.js";


export class ShaderLoader extends GameComponent {
  constructor(game) {
    super(game);
    this.vsPath = this.cnf.shader.vsPath;
    this.fsPath = this.cnf.shader.fsPath;
    this.fs = null;
    this.vs = null;
    this.program = null;
  }

  async loadResources() {
    await this.getLoaders();
    const p = programFromShaders(this.gl, this.vs, this.fs);
    progress.addPercent(10);
    return (this.program = p);
  }

  getLoaders() {
    return Promise.all([
      this.loadShader(this.vsPath, "vs", this.gl.VERTEX_SHADER),
      this.loadShader(this.fsPath, "fs", this.gl.FRAGMENT_SHADER),
    ]);
  }

  async loadShader(path, result_attr_name, sType) {
    assert(path != null, "path should not be null");
    const text = await fetchTextFile(path);
    const result = loadShader(this.gl, sType, text);
    return (this[result_attr_name] = result);
  }
}


export class ShaderProgramLoader {
  construct(gl, {vs, fs}) {
    this.gl = gl;
    this.vsPath = vs;
    this.fsPath = fs;
  }

  async loadResources() {
    [this.vs, this.fs] = await Promise.all([
      this.loadShader(this.vsPath, this.gl.VERTEX_SHADER),
      this.loadShader(this.fsPath, this.gl.FRAGMENT_SHADER),
    ]);
    this.program = programFromShaders(this.gl, this.vs, this.fs);
    return this.program;
  }

  async loadShader(path, sType) {
    assert(path != null, "path should not be null");
    const text = await fetchTextFile(path);
    return loadShader(this.gl, sType, text);
  } 
}
