import { fetchJsonFile } from "./utils/file_load.js";
import { loadTexture } from '../utils/gl_utils.js';

import { GameComponent } from '../game_component.js';


export class AtlasEntry {
  constructor(aData, name, i){
    this.aData = aData;  // backref to parent AtlasData object
    this.name = name;
    this.i = i;
    this.y0 = 0;
    this.y1 = 1;
    this.far = [];
    // see issue #86
    this.x0 = this[0] = (this.i  +0.015)/this.aData.n;
    this.x0f = this.far[0] = (this.i  +0.05)/this.aData.n
    this.x1 = this[1] = (this.i+1-0.015)/this.aData.n;
    this.x1f = this.far[1] = (this.i+1-0.05)/this.aData.n;
  }
}

export class AtlasData {
  constructor(raw){
    this.raw = raw;
    this.length = this.n = this.raw.length;
    this.names = new Set(this.raw);
    this.w = this.n*16;
    this.h = 16;
    this.data = Object.fromEntries(this.raw.map(
      (name, i) => [name, new AtlasEntry(this, name, i)]
    ));
    Object.assign(this, this.data);
  }
}

export class AtlasLoader extends GameComponent {
  constructor(game){
    super(game);
    this.data = null;
    this.texture = null;
  }

  loadResources(){
    return Promise.all([
      fetchJsonFile(this.cnf.atlas.indexPath)
      .then(raw => {
        this.data = new AtlasData(raw); 
        progress.addPercent(6);
        return this.data;
      }),
      loadTexture(this.gl, this.cnf.atlas.imgPath)
      .then(tex => {
        this.texture = tex;
        progress.addPercent(6);
        return this.texture;
      }),
    ])
  }
}
