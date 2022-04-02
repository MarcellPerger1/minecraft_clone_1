import {expectValue, loadShader, programFromShaders} from '../utils.js';

export class ShaderLoader{
  constructor(game, gl){
    this.gl = gl;
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
    return loadTextFile(expectValue(path, "Path"))
      .then(text => loadShader(this.gl, sType, text))
      .then(result => (this[result_attr_name] = result))
      .catch(reason => {throw reason;});
  }
}

export function loadTextFile(path){
  // todo use XMLHttpRequest for progress event (only needed when bigger files)
  return fetch(path).then(response => {
    if(!response.ok){
      throw new Error("cant load resource")
    }
    return response.text();
  })
  .catch(reason => {
    console.error(reason)
    throw reason;
  })
}
