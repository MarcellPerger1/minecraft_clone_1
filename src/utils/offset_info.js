import { assert } from "./assert.js";

/**
 * @typedef {[number, number, number]} Vec3
 */

export class OffsetInfo {
  /**
   * An `OffsetInfo` object describes the direction in which one block is adjacent to another
   * @param {0 | 1 | 2} axis 
   * @param {-1 | 1} sign 
   */
  constructor(axis, sign) {
    /** @type {0 | 1 | 2} */
    this.axis = axis;
    /** @type {-1 | 1} */
    this.sign = sign;
  }

  /**
   * @param {number} face
   * @returns {OffsetInfo}
   */
  static fromFaceNum(face) {
    const axis = Math.floor(face / 2);
    assert(axis === 0 || axis === 1 || axis === 2);
    const dirn01 = face % 2;
    const sign = dirn01 == 0 ? -1 : 1;
    return new this(axis, sign);
  }

  /**
   * 
   * @returns {0 | 1 | 2 | 3 | 4 | 5}
   */
  toFaceNum() {
    const dir01 = this.sign == -1 ? 0 : 1;
    return /** @type {0 | 1 | 2 | 3 | 4 | 5} */(this.axis * 2 + dir01);
  }

  /**
   * @returns {Vec3}
   */
  toVecOffset() {
    let v = [0, 0, 0];
    v[this.axis] = this.sign;
    return /** @type {Vec3} */(v);
  }


  /**
   * @param {Vec3} anchor
   * @returns {Vec3}
   */
  posRelTo(anchor) {
    let pos = /** @type {Vec3} */([...anchor]);
    pos[this.axis] += this.sign;
    return pos;
  }
}
