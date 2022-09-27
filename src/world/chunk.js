import { assert, divmod } from '../utils.js';
import { GameComponent } from '../game_component.js';
import { ElementBundler } from "../renderer/vertex_bundle.js";
import { CubeDataAdder } from '../renderer/face_culling.js';

import { Blocks } from './block_type.js';


/**
 * @typedef {import('../game.js').Game} Game
 * @typedef {[number, number, number]} Vec3
*/

export class Chunk extends GameComponent {
  /**
   * Create a `Chunk` instance
   * @param {Game | GameComponent} game
   * @param {Vec3} low
   * @param {Vec3} size
   */
  constructor(game, low, size) {
    super(game);

    this.size = vec3.clone(size);
    this.low = vec3.clone(low);
    this.high = vec3.add(vec3.create(), this.low, this.size);
    this.origin = this.low;
    this.volume = this.size[0] * this.size[1] * this.size[2];

    this.blocks = Array(this.volume).fill(Blocks.air);
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
    let ix = at[0] - this.origin[0];
    let iy = at[1] - this.origin[1];
    let iz = at[2] - this.origin[2];
    return this.blocks[this.indexFromIndexVec([ix, iy, iz])];
  }

  setBlock(at, block = Blocks.air) {
    this.wantInRange(at);
    return this.setBlockUnsafe(at, block);
  }

  setBlockUnsafe(at, block) {
    let ix = at[0] - this.origin[0];
    let iy = at[1] - this.origin[1];
    let iz = at[2] - this.origin[2];
    return (this.blocks[this.indexFromIndexVec([ix, iy, iz])] = block);
  }

  setBlockOr(at, block) {
    if (!this.inRange(at)) { return false; }
    this.setBlockUnsafe(at, block);
    return true;
  }

  setBlocks(block, positions) {
    for (const p of positions) {
      this.setBlock(p, block);
    }
  }

  getIndexVec(at) {
    let v = vec3.sub([], at, this.origin);
    return v;
  }

  getIndex(at) {
    return this.indexFromIndexVec(this.getIndexVec(at));
  }
  getPos(i) {
    return this.getPosFromVec(this.indexVecFromIndex(i));
  }

  getPosFromVec(at) {
    let v = vec3.add([], at, this.origin);
    return v;
  }

  indexVecFromIndex(i) {
    let xyz = i;
    let [z, xy] = divmod(xyz, this.size[0] * this.size[1]);
    let [y, x] = divmod(xy, this.size[0]);
    let v = [x, y, z];
    return v;
  }
  indexFromIndexVec(v) {
    let i = v[0]
      + v[1] * this.size[0]
      + v[2] * this.size[0] * this.size[1];
    return i;
  }

  inRange(pos) {
    return [0, 1, 2].every((i) => 
      (this.low[i] <= pos[i] && pos[i] < this.high[i]));
  }

  wantInRange(pos, msg = "Position out of range") {
    assert(this.inRange(pos), msg);
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.blocks.length; i++) {
      const posVec = this.getPos(i);
      const block = this.blocks[i];
      yield [posVec, block,];
    }
  }
}
