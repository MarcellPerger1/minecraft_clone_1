import { isAnyArray } from "../utils/type_check.js";
import { getGLContext } from "../utils/gl_utils.js";
import { makeLoaderMerge } from "../utils/ts/loader_utils.js";
import { GameComponent } from "../game_component.js";

import { Buffer } from "./buffers.js";
import { makeUniformsObj } from "./uniforms.js";
import { ShaderProgram } from "./shader_program.js";
import { Camera } from "./gl_camera.js";
import { AtlasLoader } from "./atlas_data.js";
import { ShaderProgramLoader } from "./shader_loader.js";
import { ElementBundler, mergeMeshObj, resetMeshObj } from "./vertex_bundle.js";
import { assert } from "../utils/assert.js";

/**
 * @typedef {import('../game.js').Game} Game
 * @typedef {import('../world/chunk.js').Chunk} Chunk
 * @typedef {import('./chunk_renderer.js').ChunkRenderer} ChunkRenderer
 */

// NOTE:
// North = +x
// Up    = +y
// East  = +z

// thing i could eventually read:
// https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics

// TODO: switch to typescript??
export class RenderMgr extends GameComponent {
  /** @type {WebGLRenderingContext} */
  _gl;
  get gl() {
    return this._gl;
  }
  set gl(value) {
    this._gl = value;
  }

  /** @type {PickingIdRenderer} */
  _pickingRenderer;
  get pickingRenderer() {
    return this._pickingRenderer;
  }
  set pickingRenderer(value) {
    this._pickingRenderer = value;
  }

  constructor(game) {
    super(game);
    this.initGL();
  }

  initGL() {
    this.gl = getGLContext(this.canvas);
  }

  // Returns Promise that fulfilles when all resources loaded and ready for a render
  async loadResources() {
    this.renderer = new DisplayRenderer(this, this.gl);
    this.pickingRenderer = new PickingIdRenderer(this, this.gl);
    await Promise.all([
      (async () => {
        await this.renderer.loadResources();
        this.renderer.init();
      })(),
      (async () => {
        await this.pickingRenderer.loadResources();
        this.pickingRenderer.init();
      })(),
    ]);
  }

  renderFrame() {
    this.renderer.renderFrame();
  }

  /**
   * @param {[number, number, number]} pos
   */
  invalidateBlockAndAdjacent(pos) {
    if (!this.world.inRange(pos)) return;
    const targetChunk = this.world.getChunkAt(pos);
    targetChunk.chunkRenderer.invalidate();
    var adjacentChunks = targetChunk.getChunksAdjacentTo(pos);
    adjacentChunks.map((c) => c.chunkRenderer.invalidate());
  }
}

/** Renderer that only handles drawing the polygons, no colors */
export class MeshRenderer extends GameComponent {
  /** @type {WebGLRenderingContext} */
  _gl;
  get gl() {
    return this._gl;
  }
  set gl(value) {
    this._gl = value;
  }
  /** @type {[number, number, number, number]} */
  clearColor;
  /** @type {AtlasLoader} */
  atlas;
  /** @type {ShaderProgramLoader} */
  shader;
  /** @type {boolean} */
  doIds;

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
    this.gl.useProgram(this.program);
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
    // There is a Vertex Attrib Object (VAO): the internal object
    // that keeps track of the attributes.
    // This is a global object and not associate with a program
    // so when the picking renderer is initialized after the normal
    // renderer, the original attributes are overwritten
    // with attributes from the picking renderer so it doesn't work.
    // That is why we need to config the array buffers.
    // I would prefer to just load a VAO (vertex attrib object)
    // here but that requires an extension in WebGL 1
    // or using WebGL 2. Instead, the VAO has to be updated with
    // our values before each render.
    // Useful link for visualising the WebGL state:
    // https://webglfundamentals.org/webgl/lessons/resources/webgl-state-diagram.html?exampleId=use-2-programs#no-help
    this.configArrayBuffers();
  }

  configGL() {
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.SCISSOR_TEST);
  }

  /**
   * Set size of webGL stuff
   * @param {[number, number]} size
   * @param {[number, number]?} [offset=null]
   */
  setGLSize(size, offset = null) {
    offset ??= [0, 0];
    this.gl.viewport(...offset, ...size);
    this.gl.scissor(...offset, ...size);
  }

  clearCanvas() {
    this.gl.clearColor(...(this.clearColor ?? [0, 0, 0, 255]));
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
      cr.updateMesh(this.doIds, true);
      mergeMeshObj(this.vertexData, cr.mesh);
    }
  }

  drawAll() {
    this.bufferDataFromBundler();
    this.vertexData.main.drawBufferedElements();
  }

  // buffers
  configArrayBuffers() {
    this.buffers.position.configArray("aVertexPosition", 3, this.gl.FLOAT);
  }

  initBuffers() {
    this._makeBuffersObj();
    this.buffers.position = this.newBuffer();
    this.buffers.indices = this.newBuffer();
  }

  _makeBuffersObj() {
    /** @type {{position?: Buffer, vertexData?: Buffer, [k: string]: Buffer | undefined}} */
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
    this.doIds = false;
  }

  initLoaders() {
    this.loader = makeLoaderMerge({
      shader: new ShaderProgramLoader(this.gl, this.cnf.shader),
      atlas: new AtlasLoader(this.game),
    }).startPromises();
    this.loader.promises.shader.then(() => {
      progress.addPercent(10);
    });
  }

  async loadResources() {
    this.initLoaders();
    await this.loader.loadResources();
    ({ atlas: this.atlas, shader: this.shader } = this.loader);
  }

  init() {
    super.init(this.shader.program);
    this.texture = this.atlas.texture;
  }

  configGL() {
    super.configGL();
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
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
    this.buffers.textureCoord = this.newBuffer();
  }

  configArrayBuffers() {
    super.configArrayBuffers();
    this.buffers.textureCoord.configArray("aTextureCoord", 2, this.gl.FLOAT);
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
      cr.updateMesh(this.doIds, this.game.frameNo % 120 == i);
      mergeMeshObj(this.vertexData, cr.mesh);
      i++;
    }
  }
}

// bits: aa d
//       ^^ ^- Direction (0=towards negative, 1=towards positive)
//        \--- Axis (0=x, 1=y, 2=z)
export const FACES = Object.freeze({
  x0: 0,
  x1: 1,
  y0: 2,
  y1: 3,
  z0: 4,
  z1: 5,
});

/**
 * @typedef {import("./face_culling.js").IdsDataT} FacesIdDataT
 */

export class PickingIdRenderer extends MeshRenderer {
  // Each color represents a 32-bit unsigned integer id
  // With the RBGA channels being 4 bytes
  // stored in little endian order
  // This should be enough for a long time as
  // even a 512x512x256 world with 16 faces/block
  // is only using 25% of the available ids
  /**
   * @param {Game | GameComponent} game
   * @param {WebGLRenderingContext} gl
   */
  constructor(game, gl) {
    super(game, gl);
    this.doIds = true;
    this.idPacker = new BlockfaceIdPacker(this);
    this.clearColor = this.idPacker.idToColor(0);
  }

  async loadResources() {
    this.shader = new ShaderProgramLoader(this.gl, this.cnf.shader.picking);
    await this.shader.loadResources();
  }

  init() {
    super.init(this.shader.program);
    this.makeRenderbuffer();
  }

  configGL() {
    super.configGL();
    this.gl.disable(this.gl.BLEND);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb);
  }

  initBuffers() {
    super.initBuffers();
    this.buffers.aId = this.newBuffer();
  }

  configArrayBuffers() {
    super.configArrayBuffers();
    this.buffers.aId.configArray("aId", 4, this.gl.FLOAT);
  }

  bufferDataFromBundler() {
    super.bufferDataFromBundler();
    this.buffers.aId.setData(new Float32Array(this.vertexData.main.aId));
  }

  // these renderbuffer methods are such mess
  // as webgl call are SO verbose!
  // WHY do so many calls take 3 args that are just CONSTANTS
  // or even values that have to be 0??!
  makeRenderbuffer() {
    // make attachments
    this.targetTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.targetTexture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
    this.depthBuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
    this.setRenderbufferSize();
    // create framebuffer
    this.fb = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb);
    // attach renderbuffers
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.targetTexture,
      0
    );
    this.gl.framebufferRenderbuffer(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.RENDERBUFFER,
      this.depthBuffer
    );
  }

  setRenderbufferSize() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.targetTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      /* mipmap level */ 0,
      /* internalFormat */ this.gl.RGBA,
      this.canvas.width,
      this.canvas.height,
      /* border (must be 0) */ 0,
      /* format */ this.gl.RGBA,
      /* type */ this.gl.UNSIGNED_BYTE,
      /* data */ null
    );
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER,
      this.gl.DEPTH_COMPONENT16,
      this.canvas.width,
      this.canvas.height
    );
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {BlockfaceInfoT?}
   */
  readBlockAtCanvasCoord(x, y) {
    this.renderFrame();
    return this._readRenderedPixelBlockface(x, y);
  }

  /**
   * @returns {BlockfaceInfoT?}
   */
  readCanvasCenter() {
    return this.readBlockAtCanvasCoord(
      this.canvas.width >> 1,
      this.canvas.height >> 1
    );
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {BlockfaceInfoT?}
   */
  _readRenderedPixelBlockface(x, y) {
    return this.idPacker.colorToBlockFace(this._readRenderedPixelColor(x, y));
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @returns {Uint8Array}
   */
  _readRenderedPixelColor(x, y) {
    return this._readPixelColor_invY(x, this.canvas.height - y);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {Uint8Array}
   */
  _readPixelColor_invY(x, y) {
    // the (0, 0) coord refers to BOTTOM left, not top left here (hence the name `_invY`)
    let dest = new Uint8Array(4); // allocate 4 bytes for the color
    this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, dest);
    return dest;
  }

  /**
   * @param {[number, number, number]} pos
   * @returns {FacesIdDataT}
   */
  getBlockIdColors(pos) {
    return /** @type {FacesIdDataT} */ (
      Object.fromEntries(
        Object.entries(FACES).map(([name, faceId]) => [
          name,
          this.idPacker.blockFaceToColor(pos, faceId),
        ])
      )
    );
  }
}

/**
 * @typedef {[[number, number, number], number]} BlockfaceInfoT
 */

export class BlockfaceIdPacker extends GameComponent {
  /**
   * @param {[number, number, number]} pos
   * @param {number} faceId
   * @returns {[number, number, number, number]}
   */
  blockFaceToColor(pos, faceId) {
    return this.idToColor(this.idFromBlockFace(pos, faceId));
  }

  /**
   * @param {Uint8Array | [number, number, number, number]} color
   * @returns {BlockfaceInfoT?}
   */
  colorToBlockFace(color) {
    return this.blockFaceFromId(this.colorToId(color));
  }

  /**
   * @param {[number, number, number]} pos
   * @param {number} faceId
   */
  idFromBlockFace(pos, faceId) {
    assert(
      Number.isInteger(faceId) && faceId >= 0 && faceId < 6,
      "faceId must be an integer between 0 and 5 (inclusive)"
    );
    faceId &= 0xf; // ensure that faceId only 4 bits long
    assert(this.world.inRange(pos), "pos must be in the world");
    // reserve 0 for nothing
    const posIdx = this.world.getBlockIdx(pos) + 1;
    assert(posIdx < 2 ** (32 - 4), "posIdx must fit into 32-4=28 bits");
    // reserve 4 bits for faces
    const id = faceId + (posIdx << 4);
    assert(id > 0, "block face id must be positive (0 is for nothing)");
    assert(id < 2 ** 32, "id must fit in 4 bytes");
    return id;
  }

  /**
   * @param {number} id
   * @returns {BlockfaceInfoT?}
   */
  blockFaceFromId(id) {
    assert(id >= 0 && id < 2 ** 32, "id must be a 32-bit UNSIGNED int");
    const faceId = id & 0xf; // face = first 4 bits
    let posIdx = id >> 4; // block = other 28 bits
    // id 0 reserved for nothing
    if (posIdx === 0) return null;
    posIdx -= 1;
    const pos = this.world.posFromIdx(posIdx);
    return [pos, faceId];
  }

  /**
   * @param {number} id
   * @returns {[number, number, number, number]}
   */
  static idToColor(id) {
    assert(
      id < 2 ** 32,
      "id must fit into a 32-bit integer " + "to be able to be used as a color"
    );
    assert(id >= 0, "id must not be negative");
    let b0 = id & 0xff;
    let b1 = (id >> 8) & 0xff;
    let b2 = (id >> 16) & 0xff;
    let b3 = (id >> 24) & 0xff;
    return /** @type {[number, number, number, number]} */ (
      [b0, b1, b2, b3].map((v) => v / 0xff)
    );
  }
  idToColor(/** @type {number} */ id) {
    return BlockfaceIdPacker.idToColor(id);
  }

  static colorToId(
    /** @type {[number, number, number, number] | Uint8Array} */ color
  ) {
    assert(
      isAnyArray(color) && color.length == 4,
      "color must be an array of length 4"
    );
    // need to be careful with highest byte:
    // bitwise operations use SIGNED 32 integers in js
    // but we need unsigned as you can't have negative id.
    // so just don't use bitwise operations for highest byte.
    // eg. 250<<24 results in `-1006...` instead of the expected `4194...`
    let v3 = color[3] * 2 ** 24;
    return color[0] + (color[1] << 8) + (color[2] << 16) + v3;
  }
  colorToId(
    /** @type {[number, number, number, number] | Uint8Array} */ color
  ) {
    return BlockfaceIdPacker.colorToId(color);
  }
}
