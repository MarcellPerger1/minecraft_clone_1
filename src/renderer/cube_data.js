import { GameComponent } from "../game_component.js";

const FAR_DIST_SQ = 130;

export class CubeVertexData extends GameComponent {
  constructor(game, p0, options) {
    super(game);
    this.p0 = p0;
    this.p1 = vec3.add([], p0, [1, 1, 1]);
    /** @type {{side: string, top: string, bottom: string}} */
    this.textures = options.textures;
    this.doTextures = Boolean(this.textures);
    this.isFar = vec3.sqrDist(this.player.position, this.p0) > FAR_DIST_SQ;
  }

  // NOTE: only texture x coords needed on a per-texture basis
  // as texture y coords always just 0 and 1 as texture is flat long
  // TODO could be tall thin to optimise png compression
  side_x0() {
    const [x0, y0, z0] = this.p0;
    const [_x1, y1, z1] = this.p1;
    
    const data = {
      positions: [x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const td = this.r.atlas.data[this.textures.side];
      const t0 = this.isFar ? td.x0f : td.x0;
      const t1 = this.isFar ? td.x1f : td.x1;
      data.texCoords = [t0, 1, t1, 1, t1, 0, t0, 0];
    }
    return data;
  }

  side_x1() {
    const [_x0, y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const td = this.r.atlas.data[this.textures.side];

    const t0 = this.isFar ? td.x0f : td.x0;
    const t1 = this.isFar ? td.x1f : td.x1;
    const data = {
      positions: [x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z1],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const td = this.r.atlas.data[this.textures.side];
      const t0 = this.isFar ? td.x0f : td.x0;
      const t1 = this.isFar ? td.x1f : td.x1;
      data.texCoords = [t1, 1, t1, 0, t0, 0, t0, 1];
    }
    return data;
  }

  side_z0() {
    const [x0, y0, z0] = this.p0;
    const [x1, y1, _z1] = this.p1;
    const td = this.r.atlas.data[this.textures.side];

    const t0 = this.isFar ? td.x0f : td.x0;
    const t1 = this.isFar ? td.x1f : td.x1;
    const data = {
      positions: [x0, y0, z0, x0, y1, z0, x1, y1, z0, x1, y0, z0],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const td = this.r.atlas.data[this.textures.side];
      const t0 = this.isFar ? td.x0f : td.x0;
      const t1 = this.isFar ? td.x1f : td.x1;
      data.texCoords = [t1, 1, t1, 0, t0, 0, t0, 1];
    }
    return data;
  }

  side_z1() {
    const [x0, y0, _z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const td = this.r.atlas.data[this.textures.side];

    const t0 = this.isFar ? td.x0f : td.x0;
    const t1 = this.isFar ? td.x1f : td.x1;
    const data = {
      positions: [x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const td = this.r.atlas.data[this.textures.side];
      const t0 = this.isFar ? td.x0f : td.x0;
      const t1 = this.isFar ? td.x1f : td.x1;
      data.texCoords = [t0, 1, t1, 1, t1, 0, t0, 0];
    }
    return data;
  }

  side_y1() {
    const [x0, _y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const data = {
      positions: [x0, y1, z0, x0, y1, z1, x1, y1, z1, x1, y1, z0],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const td = this.r.atlas.data[this.textures.top];
      const t0 = this.isFar ? td.x0f : td.x0;
      const t1 = this.isFar ? td.x1f : td.x1;
      data.texCoords = [t0, 0, t1, 0, t1, 1, t0, 1];
    }
    return data;
  }

  side_y0() {
    const [x0, y0, z0] = this.p0;
    const [x1, _y1, z1] = this.p1;
    const data = {
      positions: [x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const td = this.r.atlas.data[this.textures.bottom];
      const t0 = this.isFar ? td.x0f : td.x0;
      const t1 = this.isFar ? td.x1f : td.x1;
      data.texCoords = [t0, 1, t1, 1, t1, 0, t0, 0];
    }
    return data;
  }
}
