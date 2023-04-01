import { getGL, glErrnoToMsg } from "../utils/gl_utils.js";
import { LoaderMerge } from "../utils/loader.js";
import { GameComponent } from "../game_component.js";

import { Buffer } from "./buffers.js";
import { makeUniformsObj } from "./uniforms.js";
import { ShaderProgram } from "./shader_program.js";
import { Camera } from "./gl_camera.js";
import { AtlasLoader } from "./atlas_data.js";
import { ShaderLoader } from "./shader_loader.js";
import { CubeDataAdder } from "./face_culling.js";
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
    this.initGLConfig();
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
    this.initProgramInfo(this.loader.shader.program);
    this.atlas = this.loader.atlas;
    this.texture = this.atlas.texture;
    this.vertexData = {
      main: new ElementBundler(this.game),
      transparent: new ElementBundler(this.game),
    };
    this.initBuffers();
    this.initCamera();
  }

  initCamera() {//@both
    this.camera = new Camera(this.gl, this.uniforms);
  }

  updateCamera() {//@both
    this.camera.updateFromPlayer(this.player);
  }

  // WebGL stuff
  // initialisation
  initGL() {//@shared
    this.gl = getGL();
    if (this.gl == null) {
      throw new Error("Failed to initiialise gl");
    }
    this.clearCanvas();
    this.checkGlFault();
  }

  initGLConfig() {//@diff
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.SCISSOR_TEST);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
    this.checkGlFault();
  }

  /**
   * Set size of webGL stuff
   * @param {[number, number]} size
   */
  setGLSize(size, offset = null) {//@both?
    offset = (offset ?? [0, 0]).slice(0, 2);
    this.gl.viewport(...offset, ...size);
    this.gl.scissor(...offset, ...size);
  }

  // gl errors
  checkGlFault() {//@both
    if (!this.cnf.checkError) {
      return;
    }
    this.last_error = this.gl.getError();
    if (this.last_error !== this.gl.NO_ERROR) {
      this.onGlFault();
    }
  }

  onGlFault() {//@both
    console.error("WebGL error: ", glErrnoToMsg(this.last_error));
  }

  // other
  clearCanvas() {//@both
    this.gl.clearColor(...this.cnf.bgColor);
    this.gl.clearDepth(1.0);
    // actully does the clearing:
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  // DRAW SCENE
  renderFrame() {//@both
    this.initFrame();
    this.makeWorldMesh();
    this.drawAll();
    this.checkGlFault();
  }

  initFrame() {//@both
    this.resetRender();
    this.updateCamera();
    this.setUniforms();
  }

  drawAll() {//@both
    this.bufferDataFromBundler();
    this.vertexData.main.drawBufferedElements();
  }

  resetRender() {//@both
    this.clearCanvas();
  }

  // CUBE DATA HANDLING
  makeWorldMesh() {//@semi-both(transparency)
    resetMeshObj(this.vertexData);
    let i = 0;
    for (const c of this.world.iterChunks()) {
      /** @type {ChunkRenderer} */
      let cr = c.chunkRenderer;
      cr.updateMesh(this.game.frameNo % 120 == i);
      mergeMeshObj(this.vertexData, cr.mesh);
      i++;
    }
    this.vertexData.main.addData(this.vertexData.transparent);
  }

  addBlock(pos, block) {//@both;dep(semi-both)
    if (block.visible) {
      this.addBlockTextures(pos, block.textures);
    }
  }

  addBlockTextures(pos, tData) {//@semi-both: no need tex coords for picking
    new CubeDataAdder(this.game, pos, tData).addData();
  }

  addData(data, transparent = false) {//@semi-both: no transparent for picking shader
    return this.vertexData[transparent ? "transparent" : "main"].addData(data);
  }
  
  // UNIFORMS (todo separate uniform handler class)
  setUniforms() {//@semi-both
    this.camera.initProjectionMatrix();
    this.camera.initModelViewMatrix();
    this.initTextureSampler();
  }

  initTextureSampler() {//@display-only
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    // Tell WebGL we want to affect texture unit 0
    this.gl.activeTexture(this.gl.TEXTURE0);
    // Tell the shader we bound the texture to texture unit 0
    this.uniforms.uSampler.set_1i(0);
  }

  initUniforms() {//@both
    this.uniforms = makeUniformsObj(this.gl, this.programInfo);
  }

  // SHADER PROGRAM
  initProgramInfo(shaderProgram) {//@both
    this.programInfo = new ShaderProgram(this.gl, shaderProgram);
    this.initUniforms();
    this.gl.useProgram(this.programInfo.program);
  }

  // BUFFERS
  initBuffers() {//@semi-both
    this.buffers = {
      position: new Buffer(this.gl, this.programInfo),
      textureCoord: new Buffer(this.gl, this.programInfo),
      indices: new Buffer(this.gl, this.programInfo),
    };
    this.configArrayBuffers();
  }

  configArrayBuffers() {//@semi-both
    this.buffers.position.configArray("aVertexPosition", 3, this.gl.FLOAT);
    this.buffers.textureCoord.configArray("aTextureCoord", 2, this.gl.FLOAT);
  }

  bufferDataFromBundler() {//@semi-both
    this.buffers.position.setData(
      new Float32Array(this.vertexData.main.positions)
    );
    this.buffers.textureCoord.setData(
      new Float32Array(this.vertexData.main.texCoords)
    );
    this.buffers.indices.setData(
      new Uint16Array(this.vertexData.main.indices),
      this.gl.ELEMENT_ARRAY_BUFFER
    );
  }
}


/** Renderer that only handles drawing the polygons, no colors */
export class MeshRenderer extends GameComponent {
  constructor(game, gl, glProgram) {
    super(game);
    this.gl = gl;
    this.program = glProgram;
  }

  init() {
    this.initProgramInfo();
    this.initVertexData();
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

  drawAll() {
    this.bufferDataFromBundler();
    this.vertexData.main.drawBufferedElements();
  }

  initFrame() {
    this.resetRender();
    this.updateCamera();
    this.setUniforms();
  }

  clearCanvas() {
    this.clearColor ??= [0, 0, 0, 0];
    this.gl.clearColor(...this.clearColor);
    this.gl.clearDepth(1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
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

  initBuffers() {
    this._makeBuffersObj();
    this.buffers.position = this.newBuffer().configArray("aVertexPostion", 3, gl.FLOAT);
    this.buffers.indices = this.newBuffer();
  }

  _makeBuffersObj() {
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

/** 
 * @typedef {{positions: number[], texCoords: number[], indices: number[], maxindex?: number[]}} BundleT
 */

/** 
 * @param {{[k: string]: ElementBundler}} dest
 * @param {{[k: string]: BundleT}} src
 */
function mergeMeshObj(dest, src) {
  for(const [name, data] of Object.entries(src)) {
    dest[name].addData(data);
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
