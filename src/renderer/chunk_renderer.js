import { assert } from "../utils/assert.js";
import { GameComponent } from "../game_component.js";

import { CubeDataAdder } from "./face_culling.js";
import { ElementBundler } from "./vertex_bundle.js";

/**
 * @typedef {import("../world/chunk.js").Chunk} Chunk
 */

export class ChunkRenderer extends GameComponent {
  /**
   * @param {Chunk} chunk - The chunk for which this is the renderer
   */
  constructor(chunk) {
    super(chunk);
    this.chunk = chunk;
    this.mesh = {
      main: new ElementBundler(this),
    };
    this.remakeMesh = false;
  }

  resetMesh() {
    Object.values(this.mesh).forEach((b) => b.reset());
  }

  updateMesh(recalculate = false) {
    if (this.remakeMesh || recalculate) {
      this.makeMesh();
      this.remakeMesh = false;
    }
  }

  makeMesh() {
    this.resetMesh();
    for (const [pos, block] of this.chunk) {
      this.addBlock(pos, block);
    }
  }

  addData(data, transparent = false) {
    assert(!transparent, "transparency has not been implemented");
    return this.mesh.main.addData(data);
  }

  addBlock(pos, block) {
    if (block.visible) {
      this.addBlockTextures(pos, block.textures);
    }
  }

  addBlockTextures(pos, textures) {
    let ids = this.doPickingIds ? this.getPickingIds(pos) : void 0;
    new CubeDataAdder(this.game, pos, {textures, ids}, this).addData();
  }

  getPickingIds(pos) {
    return this.pickingRenderer.getBlockIdColors(pos);
  }
}
