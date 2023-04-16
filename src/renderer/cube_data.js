import { GameComponent } from "../game_component.js";

const FAR_DIST_SQ = 130;

/** 
 * @typedef {{positions: number[], indices: number[], maxindex?: number, texCoords?: number[], aId?: number[]}} DataT
 */

export class CubeVertexData extends GameComponent {
  constructor(game, p0, options) {
    super(game);
    this.p0 = p0;
    this.p1 = vec3.add([], p0, [1, 1, 1]);
    /** @type {{side: string, top: string, bottom: string}} */
    this.textures = options.textures;
    this.doTextures = Boolean(this.textures);
    this.ids = options.ids;
    this.doIds = Boolean(this.ids);
    this.isFar = vec3.sqrDist(this.player.position, this.p0) > FAR_DIST_SQ;
  }

  /** @returns {[number, number]} */
  getTexRangeX(/** @type {string} */texName) {
    const texData = this.r.atlas.data[texName];
    const t0 = this.isFar ? texData.x0f : texData.x0;
    const t1 = this.isFar ? texData.x1f : texData.x1;
    return [t0, t1];
  }

  getIdData(idColor) {
    return [...idColor, ...idColor, ...idColor, ...idColor];
  }

  // NOTE: only texture x coords needed on a per-texture basis
  // as texture y coords always just 0 and 1 as texture is flat long
  // TODO could be tall thin to optimise png compression
  side_x0() {
    const [x0, y0, z0] = this.p0;
    const [_x1, y1, z1] = this.p1;
    /** @type {DataT} */
    const data = {
      positions: [x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const [t0, t1] = this.getTexRangeX(this.textures.side);
      data.texCoords = [t0, 1, t1, 1, t1, 0, t0, 0];
    }
    if(this.doIds) {
      data.aId = this.getIdData(this.ids.x0);
    }
    return data;
  }

  side_x1() {
    const [_x0, y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    /** @type {DataT} */
    const data = {
      positions: [x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z1],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const [t0, t1] = this.getTexRangeX(this.textures.side);
      data.texCoords = [t1, 1, t1, 0, t0, 0, t0, 1];
    }
    if(this.doIds) {
      data.aId = this.getIdData(this.ids.x1);
    }
    return data;
  }

  side_z0() {
    const [x0, y0, z0] = this.p0;
    const [x1, y1, _z1] = this.p1;
    /** @type {DataT} */
    const data = {
      positions: [x0, y0, z0, x0, y1, z0, x1, y1, z0, x1, y0, z0],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const [t0, t1] = this.getTexRangeX(this.textures.side);
      data.texCoords = [t1, 1, t1, 0, t0, 0, t0, 1];
    }
    if(this.doIds) {
      data.aId = this.getIdData(this.ids.z0);
    }
    return data;
  }

  side_z1() {
    const [x0, y0, _z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    /** @type {DataT} */
    const data = {
      positions: [x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const [t0, t1] = this.getTexRangeX(this.textures.side);
      data.texCoords = [t0, 1, t1, 1, t1, 0, t0, 0];
    }
    if(this.doIds) {
      data.aId = this.getIdData(this.ids.z1);
    }
    return data;
  }

  side_y1() {
    const [x0, _y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    /** @type {DataT} */
    const data = {
      positions: [x0, y1, z0, x0, y1, z1, x1, y1, z1, x1, y1, z0],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const [t0, t1] = this.getTexRangeX(this.textures.top);
      data.texCoords = [t0, 0, t1, 0, t1, 1, t0, 1];
    }
    if(this.doIds) {
      data.aId = this.getIdData(this.ids.y1);
    }
    return data;
  }

  side_y0() {
    const [x0, y0, z0] = this.p0;
    const [x1, _y1, z1] = this.p1;
    /** @type {DataT} */
    const data = {
      positions: [x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1],
      indices: [0, 1, 2, 0, 2, 3],
      maxindex: 3,
    };
    if(this.doTextures) {
      const [t0, t1] = this.getTexRangeX(this.textures.bottom);
      data.texCoords = [t0, 1, t1, 1, t1, 0, t0, 0];
    }
    if(this.doIds) {
      data.aId = this.getIdData(this.ids.y0);
    }
    return data;
  }
}
