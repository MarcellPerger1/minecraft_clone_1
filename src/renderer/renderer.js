import {
  exportAs,
  // math
  toRad,
  // webgl
  getGL, glErrnoToMsg,
  // other
  LoaderMerge,
  rangeList,
  numCmp
} from '../utils.js';
import { GameComponent } from '../game_component.js';

import { Buffers } from './buffers.js';
import { AtlasLoader } from './atlas_data.js';
import { ShaderLoader } from './shader_loader.js';
import { CubeDataAdder } from './face_culling.js';
import { ElementBundler } from './vertex_bundle.js';


// NOTE: 
// West  = +x
// Up    = +y 
// North = +z


// thing i could eventually read:
// https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics

// TODO: switch to typescript??
export class Renderer extends GameComponent {
  constructor(game, do_init = true) {
    super(game);
    if (do_init) { this.init(); }
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
    this.initDoneProm = this.loader.loadResources().then(_result => {
      this.onResourcesLoaded();
    });
    return this.initDoneProm;
  }

  onResourcesLoaded() {
    this.initProgramInfo(this.loader.shader.program);
    this.initAtlasInfo(this.loader.atlas);
    this.vertexData = {
      main: new ElementBundler(this.game),
      transparent: new ElementBundler(this.game),
      opaque: new ElementBundler(this.game),
    };
    this.buffers = new Buffers(this.game);
    this.makeBuffers();
    this.configArrayBuffers();
  }

  initAtlasInfo(atlas) {
    this.atlas = atlas
    this.atlasTex = this.texture = this.atlas.texture;
    this.atlasData = this.atlas.data;
  }

  get camRot() {
    return this.player.rotation;
  }
  get camPos() {
    return this.player.position;
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
      return
    }
    this.last_error = this.gl.getError();
    if (this.last_error !== this.gl.NO_ERROR) {
      this.onGlFault();
    }
  }

  onGlFault() {
    console.error("WebGL error: ", glErrnoToMsg(this.last_error))
  }

  // other
  clearCanvas() {
    this.gl.clearColor(...this.cnf.bgColor);
    this.gl.clearDepth(1.0);
    // actully does the clearing:
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  // DRAW SCENE
  renderFrame(remakeMesh) {
    this.remakeMesh = remakeMesh;
    this.initFrame();
    this.vertexData.main.reset();
    // this.vertexData.opaque.reset();
    if (this.remakeMesh || true) {
      // only update mesh if re-render
      this.makeWorldMesh();
    }
    this.sortTransparentFaces();
    this.vertexData.main.addData(this.vertexData.opaque);
    this.vertexData.main.addData(this.vertexData.transparent);
    this.drawAll();
    this.checkGlFault();
  }

  initFrame() {
    this.resetRender();
    this.setUniforms();
  }

  drawAll() {
    this.bufferDataFromBundler(this.vertexData.opaque);
    // see https://webglfundamentals.org/webgl/lessons/webgl-text-texture.html
    // -> transperncy has issues
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.disable(this.gl.BLEND);
    this.gl.depthMask(true);
    this.vertexData.opaque.drawElements();
    this.bufferDataFromBundler(this.vertexData.transparent);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.depthMask(false);
    this.vertexData.transparent.drawElements();
    // this.vertexData.main.drawElements();
  }

  resetRender() {
    this.clearCanvas();
  }

  // CUBE DATA HANDLING
  makeWorldMesh() {
    this.vertexData.opaque.reset();
    this.vertexData.transparent.reset();
    for (const [pos, block] of this.world) {
      this.addBlock(pos, block);
    }
  }

  sortTransparentFaces() {
    let numsPerFace = {
      indices: /* 2 triangles */6,
      positions: /* 4 Vec3 */12,
      texCoords: /* 4 Vec2 */8
    };
    let data = this.vertexData.transparent;
    let posD = data.positions;
    // the decision to choose `positions` here is aribtrary
    let nFaces = data.positions.length / numsPerFace.positions;
    const getDistance = (i) => {
      let si = numsPerFace.positions * i;
      let cx = (posD[si] + posD[si + 3] + posD[si + 6] + posD[si + 9]) / 4;
      let cy = (posD[si + 1] + posD[si + 4] + posD[si + 7] + posD[si + 10]) / 4;
      let cz = (posD[si + 2] + posD[si + 5] + posD[si + 8] + posD[si + 11]) / 4;
      let dx = cx - this.camPos[0];
      let dy = cy - this.camPos[1];
      let dz = cz - this.camPos[2];
      let sqDist = dx * dx + dy * dy + dz * dz;
      return sqDist;
    }
    let faceIndices = rangeList(nFaces);
    faceIndices.sort((a, b) => {
      let v = getDistance(a) - getDistance(b);
      return v;
    }).reverse(); // -> descending
    for (let name of Object.keys(numsPerFace)) {
      let old_list = data[name];
      let new_list = Array(old_list.length);
      let stride = numsPerFace[name];
      faceIndices.forEach((old_i, new_i) => {
        for (let offset = 0; offset < stride; offset++) {
          new_list[new_i * stride + offset] = old_list[old_i * stride + offset];
        }
      })
      data[name] = new_list;
    }
  }

  addBlock(pos, block) {
    if (block.visible) {
      this.addBlockTextures(pos, block.textures);
    }
  }

  addBlockTextures(pos, tData) {
    new CubeDataAdder(this.game, pos, tData).addData();
  }

  addData(data, texture, transparent = false) {
    return this.vertexData[transparent ? 'transparent' : 'opaque']
      .addData(data, texture);
  }

  // ARRAY BUFFERS
  configArrayBuffers() {
    this.buffers.config('position', 'vertexPosition', 3, this.gl.FLOAT);
    this.buffers.config('textureCoord', 'textureCoord', 2, this.gl.FLOAT);
  }

  // UNIFORMS (todo separate uniform handler class)
  setUniforms() {
    this.initProjectionMatrix();
    this.initModelViewMatrix();
    this.initTextureSampler();
  }

  initTextureSampler() {
    // Tell WebGL we want to affect texture unit 0
    this.gl.activeTexture(this.gl.TEXTURE0);
    // Tell the shader we bound the texture to texture unit 0
    this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
  }

  /**
   * Set a uniform to matrix `mat`
   * @param {String} name - The name of the uniform
   * @param {(Array<Number> | Float32Array)} mat - The matrix
   */
  setUniformMat4(name, mat) {
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations[name], false, mat
    )
  }

  initProjectionMatrix() {
    this.setUniformMat4('projectionMatrix', this.getProjectionMatrix());
  }
  getProjectionMatrix() {
    const fieldOfView = toRad(45);
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,  // dest
      fieldOfView,
      aspect,
      zNear,
      zFar);
    return projectionMatrix;
  }

  initModelViewMatrix() {
    this.setUniformMat4('modelViewMatrix', this.getModelViewMatrix());
  }
  getModelViewMatrix() {
    var m1 = mat4.create();
    const amount = vec3.scale([], this.camPos, -1);
    // NOTEE: IMPORTANT!: does stuff in reverse order!!!
    // eg.: here, matrix will transalate, then rotateY, then rotateX
    mat4.rotateX(m1, m1, toRad(this.camRot.v));
    mat4.rotateY(m1, m1, toRad(this.camRot.h + 90));
    mat4.translate(m1, m1, amount);
    return m1;
  }

  // SHADER PROGRAM
  initProgramInfo(shaderProgram) {
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition:
          this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        textureCoord:
          this.gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      },
      uniformLocations: {
        projectionMatrix:
          this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix:
          this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        uSampler:
          this.gl.getUniformLocation(shaderProgram, 'uSampler'),
      },
    };
    this.programInfo = programInfo;
    this.gl.useProgram(this.programInfo.program);
  }

  // BUFFERS
  makeBuffers() {
    this.buffers.make('position');
    this.buffers.make('textureCoord');
    this.buffers.make('indices');
  }

  bufferDataFromBundler(b) {
    this.buffers.setData(
      'position', new Float32Array(b.positions));
    this.buffers.setData(
      'textureCoord', new Float32Array(b.texCoords));
    this.buffers.setData(
      'indices', new Uint16Array(b.indices),
      this.gl.ELEMENT_ARRAY_BUFFER);
  }
}


exportAs(Renderer);
