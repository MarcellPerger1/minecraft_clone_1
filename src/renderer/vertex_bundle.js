import {exportAs, iextend, expectValue, isString, classOf} from '../utils.js';

// simply a container utility class for each 'section' of vertex data eg a 'section' could be a cube
export class VertexBundle{
  constructor(positions=null, texCoords=null, indices=null){
    this.positions = positions ?? [];
    this.texCoords = texCoords ?? [];
    this.indices = indices ?? [];
    this.maxindex = null;
  }

  calcMaxIndex(){
    // give -1 if no items instead of -Inf
    this.maxindex = Math.max(...this.indices, -1);
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



export class ToplevelVertexBundle{
  constructor(type=null){
    this.positions = [];
    this.texCoords = [];
    this.indices = [];
    // you can try set this to 0, 1 or 2 and enjoy the CHAOS
    this.maxindex = -1;
    this.elemType = type ?? WebGLRenderingContext.UNSIGNED_SHORT;
    this.elemSize = classOf(this).elemTypeToSize(this.elemType);
    this.nElems = 0;
  }

  calcMaxIndex(){
    // give -1 if no items instead of -Inf
    this.maxindex = Math.max(...this.indices, -1);
    return this.maxindex;
  }
  
  add(bundle, texture){
    let nElems = bundle.calcMaxIndex() + 1;
    {
      iextend(this.positions, bundle.positions);
      iextend(this.texCoords, bundle.texCoords);
      iextend(this.indices, bundle.indices.map(v => v + this.maxindex + 1), this);
      this.maxindex += nElems;
    }
    this.nElems = this.indices.length;
    return this;
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
    this.bundle = new ToplevelVertexBundle();
  }
  
  addData(bundle){
    this.bundle.add(bundle, null);
  }

  getPositionData(){
    return this.bundle.positions;
  }
  getTexCoords(){
    return this.bundle.texCoords;
  }
  getIndices(){
    return this.bundle.indices;
  }
  get positions(){ return this.getPositionData(); }
  get texCoords(){ return this.getTexCoords(); }
  get indices(){ return this.getIndices(); }

  drawElements(){
    this.gl.drawElements(this.gl.TRIANGLES, this.bundle.nElems,
                           this.bundle.elemType, 0);
  }
}



exportAs(ElementBundler);
