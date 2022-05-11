import {
  expectValue,
  loadShader, programFromShaders,
  fetchTextFile
} from '../utils.js';
import {GameComponent} from '../game_component.js';

export class ShaderLoader extends GameComponent {
  constructor(game){
    super(game);
    this.vsPath = this.cnf.shader.vsPath;
    this.fsPath = this.cnf.shader.fsPath;
    this.fs = null;
    this.vs = null;
    this.program = null;
  }

  async loadResources(){
    await this.getLoaders();
    const p = programFromShaders(this.gl, this.vs, this.fs);
    return (this.program = p);
  }

  getLoaders(){
    return Promise.all([
      this.loadResource(this.vsPath, 'vs', this.gl.VERTEX_SHADER),
      this.loadResource(this.fsPath, 'fs', this.gl.FRAGMENT_SHADER)
    ])
  }

  async loadResource(path, result_attr_name, sType){
    const text = await fetchTextFile(expectValue(path, "Path"));
    const result = loadShader(this.gl, sType, text);
    return (this[result_attr_name] = result);
  }
}

