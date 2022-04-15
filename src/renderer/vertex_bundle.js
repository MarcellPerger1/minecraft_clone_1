import {exportAs, iextend, expectValue, isString, classOf} from '../utils.js';

// simply a container utility class for each 'section' of vertex data eg a 'section' could be a cube
export class VertexBundle{
  constructor(positions=null, texCoords=null, indices=null){
    this.positions = positions ?? [];
    this.texCoords = texCoords ?? [];
    this.indices = indices ?? [];
    this.maxindex = null;
  }

  calcMaxIndex(redo=false){
    if(redo){ this.maxindex = null; }
    if(this.maxindex == null){
      if(this.indices.length==0){
        this.maxindex = -1;
      }
      else{
        this.maxindex = Math.max(...this.indices);
      }
    }
    return this.maxindex;
  }

  get nElems(){
    return this.maxindex + 1;
  }
  set nElems(v){
    this.maxindex = v - 1;
  }

  imerge(...others){
    this.calcMaxIndex();
    for(let other of others){
      this.positions = iextend(this.positions, other.positions);
      this.texCoords = iextend(this.texCoords, other.texCoords);
      this.indices = iextend(this.indices,
                             other.indices.map(v => v + this.maxindex + 1), this);
      this.maxindex += other.calcMaxIndex() + 1;
    }
    return this;
  }
  add(...others){
    return this.imerge(...others);
  }
}


export class TextureBundle{
  constructor(){
    this.texBundles = {};
  }

  add(bundle, texture){
    texture = expectValue(texture, "texture")
    if(this.texBundles[texture]==null){
      this.texBundles[texture] = new VertexBundle();
    }
    this.texBundles[texture].add(bundle);
  }
}


export class ToplevelVertexBundle{
  constructor(type=null){
    this.positions = [];
    this.texCoords = [];
    this.indices = [];
    this.maxindex = null;
    this.elemType = type ?? WebGLRenderingContext.UNSIGNED_SHORT;
    this.elemSize = classOf(this).elemTypeToSize(this.elemType);
    // [{name: ..., offset: ..., nElems: ...}, ...]
    this.textureData = [];
    this.nElems = 0;
    this.maxoffset = 0;
  }

  calcMaxIndex(){
    this.maxindex = null;
    if(this.maxindex == null){
      if(this.indices.length==0){
        this.maxindex = -1;
      }
      else{
        this.maxindex = Math.max(...this.indices);
      }
    }
    return this.maxindex;
  }
  
  add(bundle, texture){
    this.calcMaxIndex();
    let nElems = bundle.calcMaxIndex() + 1;
    this.textureData.push(
      {name: texture, offset: this.maxoffset,
       nElems: bundle.indices.length});  // nElems
    // from VertexBundle
    {
      iextend(this.positions, bundle.positions);
      iextend(this.texCoords, bundle.texCoords);
      iextend(this.indices, bundle.indices.map(v => v + this.maxindex + 1), this);
      this.maxindex += nElems;
    }
    this.nElems += nElems;
    this.maxoffset += bundle.indices.length * this.elemSize;
    return this;
  }

  static fromTextureBundle(bundle, type=null){
    let b = new this(type);
    for(const [texName, sub] of Object.entries(bundle.texBundles)){
      b.add(sub, texName);
    }
    return b;
  }

  static getElemType(type, gl=WebGLRenderingContext){
    if(isString(type)){
      return expectValue(gl[type], "Type (from string)")
    }
    return type;
  }

  static elemTypeToSize(type){
    return expectValue(this.ElemT_Size[type], "type")
  }
  
  static ElemT_Size = {
    UNSIGNED_BYTE: 1,
    UNSIGNED_SHORT: 2,
    UNSIGNED_INT: 4,
  }; 
}

for(let [k, v] of Object.entries(ToplevelVertexBundle.ElemT_Size)){
  ToplevelVertexBundle.ElemT_Size[WebGLRenderingContext[k]] = v;
}


export class ElementBundler{
  constructor(gl, textures){
    this.gl = gl;
    this.textures = textures;
    this.reset();
  }
  
  reset(){
    this.final = false;
    this.texBundle = new TextureBundle();
    this.vBundle = null;
  }
  
  addData(bundle, texture){
    this.wantNotFinal();
    this.texBundle.add(bundle, texture);
  }

  finalise(){
    this.wantNotFinal("Cant finalise ElenentBundler twice");
    this.final = true;
    this.vBundle = ToplevelVertexBundle.fromTextureBundle(this.texBundle);
  }

  getPositionData(){
    this.wantFinal();
    return this.vBundle.positions;
  }
  getTexCoords(){
    this.wantFinal();
    return this.vBundle.texCoords;
  }
  getIndices(){
    this.wantFinal();
    return this.vBundle.indices;
  }
  get positions(){ return this.getPositionData(); }
  get texCoords(){ return this.getTexCoords(); }
  get indices(){ return this.getIndices(); }

  drawElements(){
    this.wantFinal();
    for(const texData of this.vBundle.textureData){
      // this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[texData.name]);
      this.gl.drawElements(this.gl.TRIANGLES, texData.nElems,
                           this.vBundle.elemType, texData.offset);
    }
  }

  wantFinal(...args){
    if(args.length==0){
      args = ["ElementBundler must be finalised"];
    }
    if(!this.final){
       // TODO custom error type
       throw new Error(...args);
    }
    return this
  }

  wantNotFinal(...args){
    if(args.length==0){
      args = ["ElementBundler must not be finalised"];
    }
    if(this.final){
       // TODO custom error type
       throw new Error(...args);
    }
    return this
  }
  
}



exportAs(ElementBundler);
