import { sortCoords, isObject } from '../utils.js';
import { GameComponent } from '../game_component.js';

export class CubeVertexData extends GameComponent {
  constructor(game, p0, p1, textures) {
    super(game);
    // argument juggling
    if (textures == null && isObject(p1)) {
      textures = p1;
      p1 = null;
    }
    if (p1 == null) {
      this.p0 = p0
      this.p1 = vec3.add([], p0, [1, 1, 1]);
    } else {
      [this.p0, this.p1] = sortCoords(p0, p1);
    }
    this.textures = textures;
  }

  // NOTE: only texture x coords needed on a per-texture basis
  // as texture y coords always just 0 and 1 as texture is flat long
  // TODO could be tall thin to optimise png compression
  side_x0() {
    const [x0, y0, z0] = this.p0;
    const [_x1, y1, z1] = this.p1;
    const td = this.r.atlas.data[this.textures.side];
    const t0 = td.x0;
    const t1 = td.x1;
    const sides = {
      positions: [
        x0, y0, z0,
        x0, y0, z1,
        x0, y1, z1,
        x0, y1, z0,
      ], texCoords: [
        t0, 1,
        t1, 1,
        t1, 0,
        t0, 0,
      ], indices: [
        0, 1, 2, 0, 2, 3,
      ], maxindex: 3
    };
    return sides;
  }

  side_x1() {
    const [_x0, y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const td = this.r.atlas.data[this.textures.side];
    const t0 = td.x0;
    const t1 = td.x1;
    const sides = {
      positions: [
        x1, y0, z0,
        x1, y1, z0,
        x1, y1, z1,
        x1, y0, z1,
      ], texCoords: [
        t1, 1,
        t1, 0,
        t0, 0,
        t0, 1,
      ], indices: [
        0, 1, 2, 0, 2, 3,
      ], maxindex: 3
    };
    return sides;
  }

  side_z0() {
    const [x0, y0, z0] = this.p0;
    const [x1, y1, _z1] = this.p1;
    const td = this.r.atlas.data[this.textures.side];
    const t0 = td.x0;
    const t1 = td.x1;
    const sides = {
      positions: [
        x0, y0, z0,
        x0, y1, z0,
        x1, y1, z0,
        x1, y0, z0,
      ], texCoords: [
        t1, 1,
        t1, 0,
        t0, 0,
        t0, 1,
      ], indices: [
        0, 1, 2, 0, 2, 3,
      ], maxindex: 3
    };
    return sides;
  }

  side_z1() {
    const [x0, y0, _z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const td = this.r.atlas.data[this.textures.side];
    const t0 = td.x0;
    const t1 = td.x1;
    const sides = {
      positions: [
        x0, y0, z1,
        x1, y0, z1,
        x1, y1, z1,
        x0, y1, z1,
      ], texCoords: [
        t0, 1,
        t1, 1,
        t1, 0,
        t0, 0,
      ], indices: [
        0, 1, 2, 0, 2, 3,
      ], maxindex: 3
    };
    return sides;
  }

  top() {
    const [x0, _y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const td = this.r.atlas.data[this.textures.top];
    const t0 = td.x0;
    const t1 = td.x1;
    const ret = {
      positions: [
        x0, y1, z0,
        x0, y1, z1,
        x1, y1, z1,
        x1, y1, z0,
      ], texCoords: [
        t0, 0,
        t1, 0,
        t1, 1,
        t0, 1,
      ], indices: [
        0, 1, 2, 0, 2, 3,
      ], maxindex: 3
    };
    return ret;
  }

  bottom() {
    const [x0, y0, z0] = this.p0;
    const [x1, _y1, z1] = this.p1;
    const td = this.r.atlas.data[this.textures.bottom];
    const t0 = td.x0;
    const t1 = td.x1;
    const ret = {
      positions: [
        x0, y0, z0,
        x1, y0, z0,
        x1, y0, z1,
        x0, y0, z1,
      ], texCoords: [
        t0, 1,
        t1, 1,
        t1, 0,
        t0, 0,
      ], indices: [
        0, 1, 2, 0, 2, 3,
      ], maxindex: 3
    };
    return ret;
  }

  side_y0() {
    return this.bottom();
  }

  side_y1() {
    return this.top();
  }

  sides() {
    const [x0, y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const sides = {
      positions: [
        // Front face
        x0, y0, z1,
        x1, y0, z1,
        x1, y1, z1,
        x0, y1, z1,

        // Back face
        x0, y0, z0,
        x0, y1, z0,
        x1, y1, z0,
        x1, y0, z0,

        // Right face
        x1, y0, z0,
        x1, y1, z0,
        x1, y1, z1,
        x1, y0, z1,

        // Left face
        x0, y0, z0,
        x0, y0, z1,
        x0, y1, z1,
        x0, y1, z0,
      ], texCoords: [
        // Front
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        // Back
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
        // Right
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
        // Left
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
      ], indices: [
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // right
        12, 13, 14, 12, 14, 15,   // left
      ], maxindex: 15
    };
    return sides;
  }

  _allPosData() {
    const [x0, y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const positions = [
      // Front face
      x0, y0, z1,
      x1, y0, z1,
      x1, y1, z1,
      x0, y1, z1,

      // Back face
      x0, y0, z0,
      x0, y1, z0,
      x1, y1, z0,
      x1, y0, z0,

      // Top face
      x0, y1, z0,
      x0, y1, z1,
      x1, y1, z1,
      x1, y1, z0,

      // Bottom face
      x0, y0, z0,
      x1, y0, z0,
      x1, y0, z1,
      x0, y0, z1,

      // Right face
      x1, y0, z0,
      x1, y1, z0,
      x1, y1, z1,
      x1, y0, z1,

      // Left face
      x0, y0, z0,
      x0, y0, z1,
      x0, y1, z1,
      x0, y1, z0,
    ];
    return positions;
  }
}
