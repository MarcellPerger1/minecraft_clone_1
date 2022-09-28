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
      transparent: new ElementBundler(this),
    };
  }

  resetMesh() {
    Object.values(this.mesh).forEach(b => b.reset());
  }

  updateMesh(recalculate=false){
    if(recalculate) {
      this.makeMesh();
    }
  }

  makeMesh(){
    this.resetMesh();
    for(const [pos, block] of this.chunk){
      this.addBlock(pos, block);
    }
  }
  
  addData(data, transparent=false){
    return this.mesh[transparent ? 'transparent' : 'main']
      .addData(data);
  }

  addBlock(pos, block){
    if(block.visible){
      this.addBlockTextures(pos, block.textures);
    }
  }

  addBlockTextures(pos, tData){
    new CubeDataAdder(this.game, pos, tData, this).addData();
  }
}