import {expectValue} from '../utils.js';

export class Loader{
  constructor(r){
    this.r = r;
    this.vsPath = this.r.cnf.vsPath;
    this.fsPath = this.r.cnf.fsPath;
    this.fsSrc = null;
    this.vsSrc = null;
  }

  loadResources(){
    return Promise.all([
      loadTextFile(this.fsPath).then(result => {return (this.fsSrc = result);}),
      this.loadResource(this.vsPath, 'vsSrc')
    ])
  }

  loadResource(path, result_attr_name){
    return loadTextFile(expectValue(path, "Path"))
      .then(result => (this[result_attr_name] = result))
  }
}

export function loadTextFile(path){
  // todo use XMLHttpRequest for progress event
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
