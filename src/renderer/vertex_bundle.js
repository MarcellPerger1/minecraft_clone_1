import { glTypeSize } from "../utils/gl_utils.js";
import { GameComponent } from "../game_component.js";

// simply a container utility class for each 'section' of vertex data
// eg a 'section' could be a cube
// NOTE: this is simply an example of the structure of the data,
// using this class is not mandatory
// but it may be helpful to automatically calculate `maxindex`
// TODO make a JSDoc typedef and remove this class?
export class VertexBundle {
  constructor(positions, texCoords, aId, indices, maxindex = null) {
    this.positions = positions ?? [];
    this.texCoords = texCoords ?? [];
    this.aId = aId ?? [];
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
    this.maxIndicesLimit = 2 ** (this.elemSize * 8) - 1;
    this.reset();
  }

  reset() {
    this.positions = [];
    this.texCoords = [];
    this.aId = [];
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
    this.aId.push(...(bundle.aId ?? []));
    this.texCoords.push(...(bundle.texCoords ?? []));
    let startFrom = this.maxindex + 1;
    this.indices.push(...bundle.indices.map((v) => v + startFrom));
    this.maxindex += nElems;
    return this;
  }

  drawBufferedElements() {
    if (this.indices.length > this.maxIndicesLimit) {
      throw new TypeError(
        `Vertex indices don't fit into the index type.` +
          ` Got ${this.indices.length} indices, max is ${this.maxIndicesLimit}` +
          ` for index size of ${this.elemSize} bytes. Increase the size` +
          ` of the type used for the element array buffer or` +
          ` reduce the amount of vertexes to be rendered.`
      );
    }
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.indices.length,
      this.elemType,
      0
    );
  }
}
