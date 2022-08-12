import { glTypeSize } from '../utils.js';
import { GameComponent } from '../game_component.js';



// simply a container utility class for each 'section' of vertex data
// eg a 'section' could be a cube
// NOTE: this is simply an example of the structure of the data, 
// using this class is not mandatory
// but it may be helpful to automatically calculate `maxindex`
// TODO make a JSDoc typedef and remove this class?
export class VertexBundle {
  constructor(positions, texCoords, indices, maxindex = null) {
    this.positions = positions ?? [];
    this.texCoords = texCoords ?? [];
    this.indices = indices ?? [];
    // give -1 if no items instead of -Inf
    this.maxindex = maxindex ?? Math.max(...this.indices, -1);
  }
}


export class ElementBundler extends GameComponent {
  constructor(game, type = null) {
    super(game);
    this.elemType = type ?? WebGLRenderingContext.UNSIGNED_SHORT;
    this.elemSize = glTypeSize(this.elemType);
    this.reset();
  }

  reset() {
    this.positions = [];
    this.texCoords = [];
    this.indices = [];
    // you can try set this to other than -1 and enjoy the CHAOS
    this.maxindex = -1;
  }

  calcMaxIndex() {
    // give -1 if no items instead of -Inf
    this.maxindex = Math.max(...this.indices, -1);
    return this.maxindex;
  }

  addData(bundle) {
    bundle.maxindex ??= Math.max(...bundle.indices, -1);
    let nElems = bundle.maxindex + 1;
    // NOTE: could use iextend here but the lists should never get that large
    this.positions.push(...bundle.positions);
    this.texCoords.push(...bundle.texCoords);
    let startFrom = this.maxindex + 1;
    this.indices.push(...bundle.indices.map(v => v + startFrom));
    this.maxindex += nElems;
    return this;
  }

  drawElements() {
    this.gl.drawElements(
      this.gl.TRIANGLES, this.indices.length, this.elemType, 0);
  }
}
