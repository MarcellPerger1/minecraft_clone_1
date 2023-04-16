import { getGLContext } from "../utils/gl_utils.js";
import { LoaderMerge } from "../utils/loader.js";
import { GameComponent } from "../game_component.js";

import { Buffer } from "./buffers.js";
import { makeUniformsObj } from "./uniforms.js";
import { ShaderProgram } from "./shader_program.js";
import { Camera } from "./gl_camera.js";
import { AtlasLoader } from "./atlas_data.js";
import { ShaderProgramLoader } from "./shader_loader.js";
import { ElementBundler } from "./vertex_bundle.js";
import { assert } from "../utils/assert.js";

/**
 * @typedef {import('../world/chunk.js').Chunk} Chunk
 * @typedef {import('./chunk_renderer.js').ChunkRenderer} ChunkRenderer
 */

// NOTE:
// Up    = +y

// thing i could eventually read:
// https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics

// TODO: switch to typescript??
export class RenderMgr extends GameComponent {
  /** @type {WebGLRenderingContext} */
  gl;
  
  constructor(game, do_init = true) {
    super(game);
    if (do_init) {
      this.initGL();
    }
  }

  initGL() {
    this.gl = getGLContext(this.canvas);
  }

  // Returns Promise that fulfilles when all resources loaded and ready for a render
  async loadResources() {
    this.renderer = new DisplayRenderer(this, this.gl);
    await this.renderer.loadResources();
    this.renderer.init();
  }

  renderFrame() {
    this.renderer.renderFrame();
  }
}


/** Renderer that only handles drawing the polygons, no colors */
export class MeshRenderer extends GameComponent {
  gl;
  
  constructor(game, gl) {
    super(game);
    this.gl = gl;
  }

  // initialisation stuffs
  init(glProgram) {
    this.program = glProgram;
    this.initProgramInfo();
    this.initVertexData();
    this.initBuffers();
    this.initCamera();
  }

  initProgramInfo() {
    this.programInfo = new ShaderProgram(this.gl, this.program);
    this.uniforms = makeUniformsObj(this.gl, this.programInfo);
  }

  initVertexData() {
    this.vertexData = {
      main: new ElementBundler(this.game),
    };
  }

  initCamera() {
    this.camera = new Camera(this.gl, this.uniforms);
  }

  makeStateCurrent() {
    this.gl.useProgram(this.program);
    this.configGL();
  }

  configGL() {
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.SCISSOR_TEST);
  }

  /**
   * Set size of webGL stuff
   * @param {[number, number]} size
   */
  setGLSize(size, offset = null) {
    offset = (offset ?? [0, 0]).slice(0, 2);
    this.gl.viewport(...offset, ...size);
    this.gl.scissor(...offset, ...size);
  }

  clearCanvas() {
    this.clearColor ??= [255, 0, 0, 255];
    this.gl.clearColor(...this.clearColor);
    this.gl.clearDepth(1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  // rendering
  renderFrame() {
    this.initFrame();
    this.makeWorldMesh();
    this.drawAll();
  }

  initFrame() {
    this.makeStateCurrent();
    this.resetRender();
    this.updateCamera();
    this.setUniforms();
  }

  resetRender() {
    this.clearCanvas();
  }

  updateCamera() {
    this.camera.updateFromPlayer(this.player);
  }

  setUniforms() {
    this.camera.initMatrix();
  }

  makeWorldMesh() {
    resetMeshObj(this.vertexData);
    for (const c of this.world.iterChunks()) {
      /** @type {ChunkRenderer} */
      let cr = c.chunkRenderer;
      cr.updateMesh(true);
      mergeMeshObj(this.vertexData, cr.mesh);
    }
  }

  drawAll() {
    this.bufferDataFromBundler();
    this.vertexData.main.drawBufferedElements();
  }

  // buffers
  initBuffers() {
    this._makeBuffersObj();
    this.buffers.position = this.newBuffer().configArray("aVertexPosition", 3, this.gl.FLOAT);
    this.buffers.indices = this.newBuffer();
  }

  _makeBuffersObj() {
    /** @type {{position: ElementBundler, vertexData: ElementBundler, [k: string]: ElementBundler}} */
    this.buffers = {};
  }

  newBuffer() {
    return new Buffer(this.gl, this.programInfo);
  }

  bufferDataFromBundler() {
    this.buffers.position.setData(
      new Float32Array(this.vertexData.main.positions)
    );
    this.buffers.indices.setData(
      new Uint16Array(this.vertexData.main.indices),
      this.gl.ELEMENT_ARRAY_BUFFER
    );
  }
}

export class DisplayRenderer extends MeshRenderer {
  constructor(game, gl) {
    super(game, gl);
    this.clearColor = this.cnf.bgColor;
  }

  async loadResources() {
    this.loader = new LoaderMerge({
      shader: new ShaderProgramLoader(this.gl, this.cnf.shader),
      atlas: new AtlasLoader(this.game),
    }).startPromises();
    this.loader.promises.shader.then(() => {
      progress.addPercent(10);
    })
    await this.loader.loadResources();
    ({atlas: this.atlas, shader: this.shader} = this.loader);
  }

  init() {
    super.init(this.shader.program);
    this.texture = this.atlas.texture;
  }

  configGL() {
    super.configGL();
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
  }

  setUniforms() {
    super.setUniforms();
    this.initTextureSampler();
  }

  initTextureSampler() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    // Tell WebGL we want to affect texture unit 0
    this.gl.activeTexture(this.gl.TEXTURE0);
    // Tell the shader we bound the texture to texture unit 0
    this.uniforms.uSampler.set_1i(0);
  }

  initBuffers() {
    super.initBuffers();
    this.buffers.textureCoord = this.newBuffer().configArray("aTextureCoord", 2, this.gl.FLOAT);
  }

  bufferDataFromBundler() {
    super.bufferDataFromBundler();
    this.buffers.textureCoord.setData(
      new Float32Array(this.vertexData.main.texCoords)
    );
  }

  makeWorldMesh() {
    resetMeshObj(this.vertexData);
    let i = 0;
    for (const c of this.world.iterChunks()) {
      /** @type {ChunkRenderer} */
      let cr = c.chunkRenderer;
      cr.updateMesh(this.game.frameNo % 120 == i);
      mergeMeshObj(this.vertexData, cr.mesh);
      i++;
    }
  }
}


export const FACES = {x0: 0, x1: 1, y0: 2, y1: 3, z0: 4, z1: 5};


export class PickingIdRenderer extends MeshRenderer {
  // Each color represents a 32-bit unsigned integer id
  // With the RBGA channels being 4 bytes
  // stored in little endian order
  // This should be enough for a long time as
  // even a 512x512x256 world with 16 faces/block
  // is only using 25% of the available ids
  constructor(game, gl) {
    super(game, gl);
    this.clearColor = this.idToColor(0);
  }

  configGL() {
    super.configGL();
    this.gl.disable(this.gl.BLEND);
  }

  initBuffers() {
    super.initBuffers();
    this.buffers.aId = this.newBuffer().configArray("aId", 4, this.gl.FLOAT);
  }

  getBlockIdColors(pos) {
    return Object.fromEntries(Object.entries(FACES).map(
      ([name, faceId]) => [name, this.blockFaceToColor(pos, faceId)]
    ));
  }

  blockFaceToColor(pos, faceId) {
    return this.idToColor(this.idFromBlockFace(pos, faceId));
  }

  idFromBlockFace(pos, faceId) {
    assert(
      Number.isInteger(faceId) && faceId >= 0 && faceId < 6, 
      "faceId must be an integer between 0 and 5 (inclusive)"
    );
    faceId &= 0xF;  // ensure that faceId only 4 bits long
    assert(this.world.inRange(pos), "pos must be in the world");
    // reserve 0 for nothing
    const posIdx = this.world.getBlockIdx(pos) + 1;
    assert(posIdx < 2**(32-4), "posIdx must fit into 32-4=28 bits");
    // reserve 4 bits for faces
    const id = faceId + (posIdx << 4);
    assert(id > 0, "block face id must be positive (0 is for nothing)");
    assert(id < 2**32, "id must fit in 4 bytes");
    return id;
  }

  blockFaceFromId(id) {
    assert(id >= 0 && id < 2**32, "id must be a 32-bit UNSIGNED int");
    const faceId = id & 0xF;  // face = first 4 bits
    const posIdx = id >> 4;  // block = other 28 bits
    const pos = this.world.posFromIdx(posIdx);
    return [pos, faceId];
  }

  idToColor(/** @type {number} */id) {
    return this.constructor.idToColor(id);
  }

  static idToColor(/** @type {number} */id) {
    assert(id < 2**32, "id must fit into a 32-bit integer " +
           "to be able to be used as a color");
    assert(id >= 0, "id must not be negative");
    let b0 = id & 0xFF;
    let b1 = (id >> 8) & 0xFF;
    let b2 = (id >> 16) & 0xFF;
    let b3 = (id >> 24) & 0xFF;
    return [b0, b1, b2, b3];
  }

  static colorToId(/** @type {[number, number, number, number]} */color) {
    assert(
      Array.isArray(color) && color.length == 4,
      "color must be an array of length 4"
    );
    assert(
      color.every(Number.isInteger),
      "each color channel must be an integer"
    );
    assert(
      color.every((v) => v >= 0 && v < 256),
      "each color channel must be between 0 and 255"
    );
    // need to be careful with highest byte:
    // bitwise operations use SIGNED 32 integers in js
    // but we need unsigned as you can't have negative id.
    // so just don't use bitwise operations for highest byte.
    // eg. 250<<24 results in `-1006...` instead of the expected `4194...`
    let v3 = color[3] * 2**24;
    return color[0] + (color[1] << 8) + (color[2] << 16) + v3;
  }

  colorToId(/** @type {[number, number, number, number]} */color) {
    return this.constructor.colorToId(color);
  }
}

/** 
 * @typedef {{positions: number[], texCoords: number[], indices: number[], maxindex?: number[]}} BundleT
 */

/** 
 * @param {{[k: string]: ElementBundler}} dest
 * @param {{[k: string]: BundleT}} src
 */
function mergeMeshObj(dest, src) {
  for(const [name, data] of Object.entries(src)) {
    if (dest[name]) dest[name].addData(data);
  }
}

/** 
 * @param {Object<string, ElementBundler>} mesh
 */
function resetMeshObj(mesh) {
  for(const bundle of Object.values(mesh)) {
    bundle.reset();
  }
}
