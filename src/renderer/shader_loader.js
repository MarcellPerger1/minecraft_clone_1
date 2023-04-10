import { assert } from "../utils/assert.js";
import { fetchTextFile } from "../utils/file_load.js";
import { loadShader, programFromShaders } from "../utils/gl_utils.js";


export class ShaderProgramLoader {
  constructor(gl, {vsPath, fsPath}) {
    this.gl = gl;
    this.vsPath = vsPath;
    this.fsPath = fsPath;
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
