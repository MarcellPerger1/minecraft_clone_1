import { GameComponent } from "../game_component.js";
import { assert, fromNested } from "../utils.js";
import { Blocks } from "./block_type.js";
import { Chunk } from "./chunk.js";



export class World extends GameComponent {
  constructor(game) {
    super(game);
    this.chunkSize = this.cnf.generation.chunkSize;
    this.nChunksFraction = vec3.div([], this.cnf.generation.wSize, this.chunkSize);
    this.nChunksFull = vec3.floor([], this.nChunksFraction);
    this.nChunks = vec3.ceil([], this.nChunksFraction);

    this.low = [0, 0, 0];
    this.size = this.cnf.generation.wSize; // vec3.mul([], this.chunkSize, this.nChunks);
    this.high = vec3.add([], this.low, this.size);
    this.wholeChunksSize = vec3.mul([], this.chunkSize, this.nChunksFull);
    this.totalSize = this.cnf.generation.wSize;
    this.lastChunkSize = vec3.sub([], this.totalSize, this.wholeChunksSize);
    
    
    /** @type {Chunk[][][]} */
    this.chunks = fromNested(this.nChunks, chunk_i => {
      let cSize = this.chunkSize.slice();
      for(let i of [1, 2, 3]) {
        if(chunk_i[i] == this.nChunks[i] - 1) {
          // last chunk
          cSize[i] =  this.lastChunkSize[i] || cSize[i]
        }
      }
      if(cSize.some(i => i == 0)) { console.warn('Creating chunk with 0 size!'); }
      return new Chunk(this, vec3.mul([], this.chunkSize, chunk_i), cSize)
    });
  }

  getChunkIndex(pos) {
    return vec3.floor([], vec3.div([], pos, this.chunkSize));
  }
  /** @returns {Chunk} */
  getChunkAt(pos) {
    const [ix,iy,iz] = this.getChunkIndex(pos);
    return this.chunks[ix][iy][iz];
  }
  
  getBlock(at) {
    this.wantInRange(at);
    return this.getBlockUnsafe(at);
  }
  getBlockOr(at, d = Blocks.air) {
    if (!this.inRange(at)) { return d; }
    return this.getBlockUnsafe(at);
  }
  getBlockUnsafe(at) {
    return this.getChunkAt(at).getBlockUnsafe(at);
  }

  setBlock(at, block = Blocks.air) {
    this.wantInRange(at);
    return this.setBlockUnsafe(at, block);
  }
  setBlockOr(at, block) {
    if (!this.inRange(at)) { return false; }
    this.setBlockUnsafe(at, block);
    return true;
  }
  setBlockUnsafe(at, block) {
    return this.getChunkAt(at).setBlockUnsafe(at, block);
  }

  setBlocks(block, positions) {
    for (const p of positions) {
      this.setBlock(p, block);
    }
  }

  inRange(pos) {
    return [0, 1, 2].every((i) => 
      (this.low[i] <= pos[i] && pos[i] < this.high[i]));
  }
  wantInRange(pos, msg = "Position out of range") {
    assert(this.inRange(pos), msg);
  }

  /**
   * @yields {Chunk}
  */
  *iterChunks() {
    for(let icx=0;icx<this.nChunks[0];icx++) {
      for(let icy=0;icy<this.nChunks[1];icy++) {
        for(let icz=0;icz<this.nChunks[2];icz++) {
          yield this.chunks[icx][icy][icz];
        }
      }
    }
  }

  *[Symbol.iterator]() {
    for(let icx=0;icx<this.nChunks[0];icx++) {
      for(let icy=0;icy<this.nChunks[1];icy++) {
        for(let icz=0;icz<this.nChunks[2];icz++) {
          yield* this.chunks[icx][icy][icz];
        }
      }
    }
  }
}