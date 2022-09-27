import { GameComponent } from "../game_component.js";
import { assert, fromNested } from "../utils.js";
import { Blocks } from "./block_type.js";
import { Chunk } from "./chunk.js";


const CHUNK_SIZE = [8, 8, 8];

export class World extends GameComponent {
  constructor(game) {
    super(game);
    // hard-coded values for now
    /** @type {[number, number, number]} */
    this.nChunks = [3, 2, 3];
    this.low = [0, 0, 0];
    this.size = vec3.mul([], CHUNK_SIZE, this.nChunks);
    this.high = vec3.add([], this.low, this.size);
    this.chunks = fromNested(this.nChunks, chunk_i => 
      new Chunk(this, vec3.mul([], CHUNK_SIZE, chunk_i), CHUNK_SIZE));
  }

  getChunkIndex(pos) {
    return vec3.floor([], vec3.div([], pos, CHUNK_SIZE));
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