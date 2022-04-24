import {exportAs,  glTypeSize} from '../utils.js';
import {GameComponent} from '../game_component.js';



// simply a container utility class for each 'section' of vertex data eg a 'section' could be a cube
export class VertexBundle{
  constructor(positions=null, texCoords=null, indices=null){
    this.positions = positions ?? [];
    this.texCoords = texCoords ?? [];
    this.indices = indices ?? [];
    // give -1 if no items instead of -Inf
    this.maxindex = Math.max(...this.indices, -1);
  }
}


export class ToplevelVertexBundle{
  constructor(type=null){
    this.positions = [];
    this.texCoords = [];
    this.indices = [];
    // you can try set this to other than -1 and enjoy the CHAOS
    this.maxindex = -1;
    this.elemType = type ?? WebGLRenderingContext.UNSIGNED_SHORT;
    this.elemSize = glTypeSize(this.elemType);
    this.nElems = 0;
  }

  calcMaxIndex(){
    // give -1 if no items instead of -Inf
    this.maxindex = Math.max(...this.indices, -1);
    return this.maxindex;
  }
  
  add(bundle){
    let nElems = bundle.maxindex + 1;
    {
      // iextend(this.positions, bundle.positions);
      // iextend(this.texCoords, bundle.texCoords);
      // iextend(this.indices, bundle.indices.map(v => v + this.maxindex + 1));
      this.positions.push(...bundle.positions);
      this.texCoords.push(...bundle.texCoords);
      this.indices.push(...bundle.indices.map(v => v + this.maxindex + 1));
      this.maxindex += nElems;
    }
    this.nElems = this.indices.length;
    return this;
  }
}


export class ElementBundler extends GameComponent{
  constructor(game){
    super(game);
    this.reset();
  }
  
  reset(){
    this.bundle = new ToplevelVertexBundle();
  }
  
  addData(bundle){
    this.bundle.add(bundle);
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
    this.gl.drawElements(
      this.gl.TRIANGLES, this.bundle.nElems, this.bundle.elemType, 0);
  }
}



exportAs(ElementBundler);
