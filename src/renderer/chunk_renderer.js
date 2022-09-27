import { GameComponent } from "../game_component";

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
    this.mesh.main.addData(this.mesh.transparent);
  }
  
  addData(data, texture, transparent=false){
    return this.mesh[transparent ? 'transparent' : 'main']
      .addData(data, texture);
  }

  addBlock(pos, block){
    if(block.visible){
      this.addBlockTextures(pos, block.textures);
    }
  }

  addBlockTextures(pos, tData){
    new CubeDataAdder(this.game, pos, tData).addData();
  }
}