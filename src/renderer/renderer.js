import { getGLContext, glErrnoToMsg } from "../utils/gl_utils.js";
import { LoaderMerge } from "../utils/loader.js";
import { GameComponent } from "../game_component.js";

import { Buffer } from "./buffers.js";
import { makeUniformsObj } from "./uniforms.js";
import { ShaderProgram } from "./shader_program.js";
import { Camera } from "./gl_camera.js";
import { AtlasLoader } from "./atlas_data.js";
import { ShaderLoader } from "./shader_loader.js";
import { ElementBundler } from "./vertex_bundle.js";

/**
 * @typedef {import('../world/chunk.js').Chunk} Chunk
 * @typedef {import('./chunk_renderer.js').ChunkRenderer} ChunkRenderer
 */

// NOTE:
// Up    = +y

// thing i could eventually read:
// https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics

// TODO: switch to typescript??
export class Renderer extends GameComponent {
  constructor(game, do_init = true) {
    super(game);
    if (do_init) {
      this.init();
    }
  }

  init() {
    this.initGL();
  }

  /**
   * @type {WebGLRenderingContext}
   */
  get gl() {
    return this._gl;
  }
  set gl(v) {
    this._gl = v;
  }

  initLoaders() {//@shared
    this.loader = new LoaderMerge({
      shader: new ShaderLoader(this.game),
      atlas: new AtlasLoader(this.game),
    });
  }

  // Returns Promise that fulfilles when all resources loaded and ready for a render
  loadResources() {//@shared
    this.initLoaders();
    this.initDoneProm = this.loader.loadResources().then((_result) => {
      this.onResourcesLoaded();
    });
    return this.initDoneProm;
  }

  onResourcesLoaded() {//@semi-both
    this._mr = new DisplayRenderer(this, this.gl, this.loader.shader.program, this.loader.atlas);
    this._mr.init();
    this.atlas = this.loader.atlas;
    this.texture = this.atlas.texture;
  }

  // WebGL stuff
  // initialisation
  initGL() {//@shared
    this.gl = getGLContext(this.canvas);
  }

  renderFrame() {
    this._mr.renderFrame();
  }
}


/** Renderer that only handles drawing the polygons, no colors */
export class MeshRenderer extends GameComponent {
  gl;
  
  constructor(game, gl, glProgram) {
    super(game);
    this.gl = gl;
    this.program = glProgram;
  }

  // initialisation stuffs
  init() {
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
    this.camera.initProjectionMatrix();
    this.camera.initModelViewMatrix();
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
  constructor(game, gl, glProgram, atlas) {
    super(game, gl, glProgram);
    this.clearColor = this.cnf.bgColor;
    this.atlas = atlas;
    this.texture = this.atlas.texture;
  }

  configGL() {
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.SCISSOR_TEST);
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
