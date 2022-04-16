import {
  expectValue,
  loadShader, programFromShaders,
  fetchTextFile
} from '../utils.js';
import {GameComponent} from '../game_component.js';

export class ShaderLoader extends GameComponent {
  constructor(game){
    super(game);
    this.vsPath = game.cnf.vsPath;
    this.fsPath = game.cnf.fsPath;
    this.fs = null;
    this.vs = null;
  }

  loadResources(){
    return this.getLoaders()
      .then(_res => programFromShaders(this.gl, this.vs, this.fs))
      .then(p => (this.program = p));
  }

  getLoaders(){
    return Promise.all([
      this.loadResource(this.vsPath, 'vs', this.gl.VERTEX_SHADER),
      this.loadResource(this.fsPath, 'fs', this.gl.FRAGMENT_SHADER)
    ])
  }

  loadResource(path, result_attr_name, sType){
    return fetchTextFile(expectValue(path, "Path"))
      .then(text => loadShader(this.gl, sType, text))
      .then(result => (this[result_attr_name] = result))
      .catch(reason => {throw reason;});
  }
}

