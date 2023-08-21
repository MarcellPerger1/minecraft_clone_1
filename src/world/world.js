import { assert } from "../utils/assert.js";
import { fromNested } from "../utils/array_utils.js";
import { divmod } from "../utils/math.js";
import { GameComponent } from "../game_component.js";

import { Blocks } from "./block_type.js";
import { Chunk } from "./chunk.js";

/**
 * @typedef {[number, number, number]} Vec3
 */

export class World extends GameComponent {
  constructor(game) {
    super(game);
    this.low = [0, 0, 0];
    this.size = this.cnf.generation.wSize;
    this.high = vec3.add([], this.low, this.size);
    this.chunkSize = this.cnf.generation.chunkSize;

    let nChunksFraction = vec3.div([], this.size, this.chunkSize);
    this.nFullChunks = vec3.floor([], nChunksFraction);
    this.nChunks = vec3.ceil([], nChunksFraction);

    this.fullChunksSize = vec3.mul([], this.chunkSize, this.nFullChunks);
    this.lastChunkSize = vec3.sub([], this.size, this.fullChunksSize);

    /** @type {Chunk[][][]} */
    this.chunks = fromNested(this.nChunks, (chunk_i) => {
      let cSize = this._getChunkSize(chunk_i);
      return new Chunk(this, vec3.mul([], this.chunkSize, chunk_i), cSize);
    });
  }

  getBlockIdx(pos) {
    this.wantInRange(pos);
    const relPos = vec3.sub([], pos, this.low);
    // x is least significant, z is most significant in id
    return (
      relPos[0] +
      relPos[1] * this.size[0] +
      relPos[2] * this.size[0] * this.size[1]
    );
  }

  posFromIdx(idx) {
    const xyz = idx;
    const [z, xy] = divmod(xyz, this.size[0] * this.size[1]);
    const [y, x] = divmod(xy, this.size[0]);
    const relPos = [x, y, z];
    return vec3.add([], relPos, this.low);
  }

  checkChunkSize(cSize) {
    if (cSize.some((i) => i === 0)) {
      throw new Error(
        "Creating chunk with 0 size! This should never " +
          "happen if the code above works properly."
      );
    }
  }

  _getChunkSize(chunk_i) {
    // used at init-time to calculate chunk size
    let cSize = this.chunkSize.slice();
    for (let dir of [1, 2, 3]) {
      if (this.isLastChunkInDirection(dir, chunk_i)) {
        // if lastChunkSize == 0, there is no fractional chunk at the end
        // so the last chunk is full chunk so use orig (full) size
        cSize[dir] = this.lastChunkSize[dir] || cSize[dir];
      }
    }
    this.checkChunkSize(cSize);
    return cSize;
  }

  isLastChunkInDirection(direction, full_index) {
    return full_index[direction] == this.nChunks[direction] - 1;
  }

  /**
   * @param {Vec3} pos
   */
  getChunkIndex(pos) {
    return vec3.floor([], vec3.div([], pos, this.chunkSize));
  }
  /** @returns {Chunk} */
  getChunkAt(pos) {
    const [ix, iy, iz] = this.getChunkIndex(pos);
    return this.chunks[ix][iy][iz];
  }
  /**
   * @param {Vec3} indices
   * @returns {Chunk?}
   */
  getChunkFromIndices(indices) {
    const [ix, iy, iz] = indices;
    return this.chunks[ix]?.[iy]?.[iz];
  }

  /**
   * @param {Vec3} rootChunkIdx
   * @param {0 | 1 | 2} dirn_axis
   * @param {1 | -1} dirn_sign
   * @returns {Chunk?}
   */
  getAdjacentChunkInDirn(rootChunkIdx, dirn_axis, dirn_sign) {
    /** @type {Vec3} */ const rootIdx = [...rootChunkIdx];
    rootIdx[dirn_axis] += dirn_sign;
    return this.getChunkFromIndices(rootIdx);
  }

  getBlock(at) {
    this.wantInRange(at);
    return this.getBlockUnsafe(at);
  }
  getBlockOr(at, d = Blocks.air) {
    if (!this.inRange(at)) {
      return d;
    }
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
    if (!this.inRange(at)) {
      return false;
    }
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
    return [0, 1, 2].every(
      (i) => this.low[i] <= pos[i] && pos[i] < this.high[i]
    );
  }
  wantInRange(pos, msg = "Position out of range") {
    assert(this.inRange(pos), msg);
  }

  /**
   * @yields {Chunk}
   */
  *iterChunks() {
    for (let icx = 0; icx < this.nChunks[0]; icx++) {
      for (let icy = 0; icy < this.nChunks[1]; icy++) {
        for (let icz = 0; icz < this.nChunks[2]; icz++) {
          yield this.chunks[icx][icy][icz];
        }
      }
    }
  }

  *[Symbol.iterator]() {
    for (let icx = 0; icx < this.nChunks[0]; icx++) {
      for (let icy = 0; icy < this.nChunks[1]; icy++) {
        for (let icz = 0; icz < this.nChunks[2]; icz++) {
          yield* this.chunks[icx][icy][icz];
        }
      }
    }
  }
}
