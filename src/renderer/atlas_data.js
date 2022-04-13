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
