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

  initLoaders() {
    this.loader = new LoaderMerge({
      shader: new ShaderLoader(this.game),
      atlas: new AtlasLoader(this.game),
    });
  }

  // Returns Promise that fulfilles when all resources loaded and ready for a render
  loadResources() {
    this.initLoaders();
    this.initDoneProm = this.loader.loadResources().then((_result) => {
      this.onResourcesLoaded();
    });
    return this.initDoneProm;
  }

  onResourcesLoaded() {
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

  initCamera() {
    this.camera = new Camera(this.gl, this.uniforms);
  }

  updateCamera() {
    this.camera.updateFromPlayer(this.player);
  }

  // WebGL stuff
  // initialisation
  initGL() {
    this.gl = getGL();
    if (this.gl == null) {
      throw new Error("Failed to initiialise gl");
    }
    this.clearCanvas();
    this.checkGlFault();
  }

  initGLConfig() {
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
  setGLSize(size, offset = null) {
    offset = (offset ?? [0, 0]).slice(0, 2);
    this.gl.viewport(...offset, ...size);
    this.gl.scissor(...offset, ...size);
  }

  // gl errors
  checkGlFault() {
    if (!this.cnf.checkError) {
      return;
    }
    this.last_error = this.gl.getError();
    if (this.last_error !== this.gl.NO_ERROR) {
      this.onGlFault();
    }
  }

  onGlFault() {
    console.error("WebGL error: ", glErrnoToMsg(this.last_error));
  }

  // other
  clearCanvas() {
    this.gl.clearColor(...this.cnf.bgColor);
    this.gl.clearDepth(1.0);
    // actully does the clearing:
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  // DRAW SCENE
  renderFrame() {
    this.initFrame();
    this.makeWorldMesh();
    this.drawAll();
    this.checkGlFault();
  }

  initFrame() {
    this.resetRender();
    this.updateCamera();
    this.setUniforms();
  }

  drawAll() {
    this.bufferDataFromBundler();
    this.vertexData.main.drawBufferedElements();
  }

  resetRender() {
    this.clearCanvas();
  }

  // CUBE DATA HANDLING
  makeWorldMesh() {
    this.vertexData.main.reset();
    this.vertexData.transparent.reset();
    let i = 0;
    for (const c of this.world.iterChunks()) {
      /** @type {ChunkRenderer} */
      let cr = c.chunkRenderer;
      if (this.game.frameNo % 120 == i) {
        cr.remakeMesh = true;
      }
      cr.updateMesh();
      this.vertexData.main.addData(cr.mesh.main);
      this.vertexData.transparent.addData(cr.mesh.transparent);
      i++;
    }
    this.vertexData.main.addData(this.vertexData.transparent);
  }

  addBlock(pos, block) {
    if (block.visible) {
      this.addBlockTextures(pos, block.textures);
    }
  }

  addBlockTextures(pos, tData) {
    new CubeDataAdder(this.game, pos, tData).addData();
  }

  addData(data, transparent = false) {
    return this.vertexData[transparent ? "transparent" : "main"].addData(data);
  }
  
  // UNIFORMS (todo separate uniform handler class)
  setUniforms() {
    this.camera.initProjectionMatrix();
    this.camera.initModelViewMatrix();
    this.initTextureSampler();
  }

  initTextureSampler() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    // Tell WebGL we want to affect texture unit 0
    this.gl.activeTexture(this.gl.TEXTURE0);
    // Tell the shader we bound the texture to texture unit 0
    this.uniforms.uSampler.set_1i(0);
  }

  initUniforms() {
    this.uniforms = makeUniformsObj(this.gl, this.programInfo);
  }

  // SHADER PROGRAM
  initProgramInfo(shaderProgram) {
    this.programInfo = new ShaderProgram(this.gl, shaderProgram);
    this.initUniforms();
    this.gl.useProgram(this.programInfo.program);
  }

  // BUFFERS
  initBuffers() {
    this.buffers = {
      position: new Buffer(this.gl, this.programInfo),
      textureCoord: new Buffer(this.gl, this.programInfo),
      indices: new Buffer(this.gl, this.programInfo),
    };
    this.configArrayBuffers();
  }

  configArrayBuffers() {
    this.buffers.position.configArray("aVertexPosition", 3, this.gl.FLOAT);
    this.buffers.textureCoord.configArray("aTextureCoord", 2, this.gl.FLOAT);
  }

  bufferDataFromBundler() {
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
