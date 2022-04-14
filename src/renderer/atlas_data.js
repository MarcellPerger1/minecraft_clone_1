import {GameComponent} from '../game_component.js';
import {fetchJsonFile, loadTextureProm} from '../utils.js';

export class AtlasEntry {
  constructor(aData, name, i){
    this.aData = aData;
    this.name = name;
    this.i = i;
    this.y0 = 0;
    this.y1 = 1;
    this.x0 = this.i/this.aData.w;
    this.x1 = (this.i+1)/this.aData.w;
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
    this.textures = null;
  }

  loadResources(){
    return Promise.all([
      fetchJsonFile('./textures/atlas.index.json')
      .then(raw => new AtlasData(raw))
      .then(v => (this.data = v)),
      // todo: load atlas
      loadTextureProm(this.gl, './textures/atlas.min.png')
      .then(tex => (this.texture = tex)),
    ])
  }
}
// todo loader union class
