import { GameComponent } from "../game_component.js";
import { vec3 } from "../gl-matrix.js";
import { CubeVertexData } from "./cube_data.js";

/**
 * @typedef {import('../game.js').Game} Game
 * @typedef {[number, number, number]} Vec3
 * @typedef {[number, number, number, number]} ColorT
 * @typedef {{x0: ColorT, x1: ColorT, y0: ColorT, y1: ColorT, z0: ColorT, z1: ColorT}} IdsDataT
 */

export class CubeDataAdder extends GameComponent {
  /**
   *
   * @param {GameComponent | Game} game
   * @param {Vec3} pos
   * @param {{textures: {side: string, top: string, bottom: string}, ids: IdsDataT}} options
   * @param {{addData: (d: any, t: boolean) => void}} renderTarget
   */
  constructor(game, pos, options, renderTarget) {
    super(game);
    this.pos = pos;
    this.cData = new CubeVertexData(this.game, pos, options);
    this.block = this.world.getBlock(this.pos);
    this.renderTarget = renderTarget;
  }

  addData() {
    if (!this.block.visible) {
      return;
    }
    // Yes, using the loop is faster than unrolling it
    // for benchmark see https://jsperf.app/ledilu
    // Using unrolled version is 31% slower.
    for (const [offset, name] of _OFFSET_NAMES) {
      if (this.shouldRenderSide(offset)) {
        let data = this.cData[name]();
        this.renderTarget.addData(data, this.block.transparent);
      }
    }
  }

  shouldRenderSide(offset) {
    let pos = vec3.add([], this.pos, offset);
    if (!this.world.inRange(pos)) {
      return true; // no way for block to be there
    }
    let side_block = this.world.getBlockUnsafe(pos);
    if (!side_block.visible) {
      return true;
    }
    if (
      this.block.transparent &&
      side_block.transparent &&
      offset.some((c) => c > 0)
    ) {
      return false;
    }
    if (side_block.transparent) {
      return true;
    }
    return false;
  }
}

const _OFFSET_NAMES = [
  [vec3.fromValues(-1, 0, 0), "side_x0"],
  [vec3.fromValues(1, 0, 0), "side_x1"],
  [vec3.fromValues(0, -1, 0), "side_y0"],
  [vec3.fromValues(0, 1, 0), "side_y1"],
  [vec3.fromValues(0, 0, -1), "side_z0"],
  [vec3.fromValues(0, 0, 1), "side_z1"],
];
