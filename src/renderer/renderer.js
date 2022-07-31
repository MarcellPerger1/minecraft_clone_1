import {
  exportAs, 
  // math
  toRad,
  // webgl
  getGL, glErrnoToMsg,
  // other
  LoaderMerge
} from '../utils.js';
import {GameComponent} from '../game_component.js';

import {Buffers} from './buffers.js';
import {AtlasLoader} from './atlas_data.js';
import {ShaderLoader} from './shader_loader.js';
import {CubeDataAdder} from './face_culling.js';
import {ElementBundler} from './vertex_bundle.js';


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
  get gl(){
    return this._gl;
  }
  set gl(v){
    this._gl = v;
  }

  initLoaders(){
    this.loader = new LoaderMerge({
      shader: new ShaderLoader(this.game),
      atlas: new AtlasLoader(this.game),
    });
  }

  // Returns Promise that fulfilles when all resources loaded and ready for a render
  loadResources(){
    this.initLoaders();
    this.initDoneProm = this.loader.loadResources().then(_result => {
      this.onResourcesLoaded();
    });
    return this.initDoneProm;
  }

  onResourcesLoaded(){
    this.initProgramInfo(this.loader.shader.program);
    this.initAtlasInfo(this.loader.atlas);
    this.vertexData = new ElementBundler(this.game);
    this.buffers = new Buffers(this.game);
    this.makeBuffers();
    this.configArrayBuffers();
  }

  initAtlasInfo(atlas){
    this.atlas = atlas
    this.atlasTex = this.texture = this.atlas.texture;
    this.atlasData = this.atlas.data;
  }
  
  get camRot(){
    return this.player.rotation;
  }
  get camPos(){
    return this.player.position;
  }
  
  // WebGL stuff
  // initialisation
  initGL(){
    this.gl = getGL();
    if(this.gl==null){
      throw new Error("Failed to initiialise gl");
    }
    this.clearCanvas();
    this.checkGlFault();
  }
  
  initGLConfig(){
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.SCISSOR_TEST);
    this.checkGlFault();
  }

  /**
   * Set size of webGL stuff
   * @param {[number, number]} size
  */
  setGLSize(size, offset=null){
    offset = (offset ?? [0,0]).slice(0, 2);
    this.gl.viewport(...offset, ...size);
    this.gl.scissor(...offset, ...size);
  }

  // gl errors
  checkGlFault(){
    if(!this.cnf.checkError){
      return
    }
    this.last_error = this.gl.getError();
    if(this.last_error !== this.gl.NO_ERROR){
      this.onGlFault();
    }
  }

  onGlFault(){
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
  renderFrame(remakeMesh){
    this.remakeMesh = remakeMesh;
    this.initFrame();
    if(this.remakeMesh){
      // only update mesh if re-render
      this.makeWorldMesh();
    }
    this.drawAll();
    this.checkGlFault();
  }

  initFrame(){
    this.resetRender();
    this.setUniforms();
  }

  drawAll(){
    this.bufferDataFromBundler();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.vertexData.drawElements();
  }

  resetRender(){
    this.clearCanvas();
  }

  // CUBE DATA HANDLING
  makeWorldMesh(){
    this.vertexData.reset();
    for(const [pos, block] of this.world){
      this.addBlock(pos, block);
    }
  }

  addBlock(pos, block){
    if(block.visible){
      this.addBlockTextures(pos, block.textures);
    }
  }

  addBlockTextures(pos, tData){
    new CubeDataAdder(this.game, pos, tData).addData();
  }

  addData(data, texture){
    return this.vertexData.addData(data, texture);
  }

  // ARRAY BUFFERS
  configArrayBuffers(){
    this.buffers.config('position', 'vertexPosition', 3, this.gl.FLOAT);
    this.buffers.config('textureCoord', 'textureCoord', 2, this.gl.FLOAT);
  }

  // UNIFORMS (todo separate uniform handler class)
  setUniforms(){
    this.initProjectionMatrix();
    this.initModelViewMatrix();
    this.initTextureSampler();
  }

  initTextureSampler(){
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
  setUniformMat4(name, mat){
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations[name], false, mat
    )
  }
  
  initProjectionMatrix(){
    this.setUniformMat4('projectionMatrix', this.getProjectionMatrix());
  }
  getProjectionMatrix(){
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

  initModelViewMatrix(){
    this.setUniformMat4('modelViewMatrix', this.getModelViewMatrix());
  }
  getModelViewMatrix(){
    var m1 = mat4.create();
    const amount = vec3.scale([], this.camPos, -1);
    // NOTEE: IMPORTANT!: does stuff in reverse order!!!
    // eg.: here, matrix will transalate, then rotateY, then rotateX
    mat4.rotateX(m1, m1, toRad(this.camRot.v));
    mat4.rotateY(m1, m1, toRad(this.camRot.h + 180));
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
  makeBuffers(){
    this.buffers.make('position');
    this.buffers.make('textureCoord');
    this.buffers.make('indices');
  }

  bufferDataFromBundler(){
    this.buffers.setData(
      'position', new Float32Array(this.vertexData.positions));
    this.buffers.setData(
      'textureCoord', new Float32Array(this.vertexData.texCoords));
    this.buffers.setData(
      'indices', new Uint16Array(this.vertexData.indices), 
      this.gl.ELEMENT_ARRAY_BUFFER);
  }
}


exportAs(Renderer);
