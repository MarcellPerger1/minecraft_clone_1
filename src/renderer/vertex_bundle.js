import { exportAs, glTypeSize } from '../utils.js';
import { GameComponent } from '../game_component.js';



// simply a container utility class for each 'section' of vertex data eg a 'section' could be a cube
export class VertexBundle {
  constructor(positions = null, texCoords = null, indices = null) {
    this.positions = positions ?? [];
    this.texCoords = texCoords ?? [];
    this.indices = indices ?? [];
    // give -1 if no items instead of -Inf
    this.maxindex = Math.max(...this.indices, -1);
  }
}


export class ToplevelVertexBundle {
  constructor(type = null) {
    // you can try set this to other than -1 and enjoy the CHAOS
    this.maxindex = -1;
    this.elemType = type ?? WebGLRenderingContext.UNSIGNED_SHORT;
    this.elemSize = glTypeSize(this.elemType);
    this.elemCnt = 1<<(this.elemSize * 8)-1;
    this.posLen = 0;
    this.texLen = 0;
    this.indexLen = 0;
    this.nElems = 0;
    this.positions = new Float32Array(this.elemCnt);
    this.texCoords = new Float32Array(this.elemCnt);
    this.indices = new Uint16Array(this.elemCnt);
  }

  calcMaxIndex() {
    // give -1 if no items instead of -Inf
    this.maxindex = Math.max(...this.indices, -1);
    return this.maxindex;
  }

  add(bundle) {
    let nElems = bundle.maxindex + 1;
    // NOTE: could use iextend here but the lists should never get that large
    this.positions.set(bundle.positions, this.posLen);
    this.posLen += bundle.positions.length;
    this.texCoords.set(bundle.texCoords, this.texLen);
    this.texLen += bundle.texCoords.length;
    this.indices.set(bundle.indices.map(v => v + this.maxindex + 1), this.indexLen);
    this.indexLen += bundle.indices.length;
    this.maxindex += nElems;
    return this;
  }
}


export class ElementBundler extends GameComponent {
  constructor(game) {
    super(game);
    this.reset();
  }

  reset() {
    this.bundle = new ToplevelVertexBundle();
  }

  addData(bundle) {
    this.bundle.add(bundle);
  }

  getPositionData() {
    return this.bundle.positions;
  }
  getTexCoords() {
    return this.bundle.texCoords;
  }
  getIndices() {
    return this.bundle.indices;
  }
  get positions() { return this.getPositionData(); }
  get texCoords() { return this.getTexCoords(); }
  get indices() { return this.getIndices(); }

  drawElements() {
    this.gl.drawElements(
      this.gl.TRIANGLES, this.bundle.indices.length, this.bundle.elemType, 0);
  }
}



exportAs(ElementBundler);
