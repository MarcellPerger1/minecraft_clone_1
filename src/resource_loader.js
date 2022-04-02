import {expectValue} from './utils.js';

export class Loader{
  constructor(r){
    this.vsPath = r.cnf.vsPath;
    this.fsPath = r.cnf.fsPath;
    this.fsSrc = null;
    this.vsSrc = null;
  }

  loadResources(){
    return Promise.all([
      this.loadResource(this.vsPath, 'vsSrc'),
      this.loadResource(this.fsPath, 'fsSrc')
    ]);
  }

  loadResource(path, result_attr_name){
    return loadTextFile(expectValue(path, "Path"))
      .then(result => (this[result_attr_name] = result))
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
