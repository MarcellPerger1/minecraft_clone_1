import {
  // general utils
  exportAs, expectValue, nameOrValue,
  // math
  toRad,
  //type checking
  isNumber,
  // webgl
  getGL, glErrnoToMsg,
  // other
  LoaderMerge
} from '../utils.js';
import {GameComponent} from '../game_component.js';

import {Blocks} from '../world.js';

import {AtlasLoader} from './atlas_data.js';
import {ShaderLoader} from './shader_loader.js';
import {CubeDataAdder} from './face_culling.js';
import {ElementBundler, VertexBundle} from './vertex_bundle.js';


// NOTE: 
// West  = +x
// Up    = +y 
// North = +z


// https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics

// TODO: switch to typescript?
export class Renderer extends GameComponent {
  constructor(game, do_init = true) {
    super(game);
    this.nFaults = 0;
    this.textures = {};
    this.buffers = {};
    if (do_init) { this.init(); }
  }

  init() {
    this.initGL();
    this.initGLConfig();
  }

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
    this.checkGlFault();
  }

  // gl errors
  checkGlFault(){
    if(this.cnf.check_error){
      this.last_error = this.gl.getError();
      if(this.last_error !== this.gl.NO_ERROR){
        this.onGlFault();
      }
    }
  }

  onGlFault(){
    if (this.nFaults < 64){
      console.error("WebGL error: ", glErrnoToMsg(this.last_error))
    }
    else if(this.nFaults == 64){
      console.error("Too many WebGL errors: only reporting first 64.")
    }
    this.nFaults++;
  }
  
  // other
  clearCanvas() {
    this.gl.clearColor(...this.cnf.bgColor);
    this.gl.clearDepth(1.0);
    // actully does the clearing:
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }
  
  // DRAW SCENE
  renderFrame(){
    this.initFrame();
    this.addWorldData();
    this.drawAll();
    this.checkGlFault();
  }

  initFrame(){
    this.resetRender();
    this.setUniforms();
  }

  drawAll(){
    this.bufferDataFromBundler();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
    this.vertexData.drawElements();
  }

  resetRender(){
    this.clearCanvas();
    this.vertexData.reset();
  }

  // CUBE DATA HANDLING
  addWorldData(){
    for(const [pos, block] of this.world){
      this.addBlock(pos, block);
    }
  }

  // TODO: remove this - too specialise, use addBlock instead
  addGrassBlock(pos){
    this.addBlock(pos, {
      side: 'grass_side', top: 'grass_top', bottom: 'grass_bottom'})
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
    let bundle = new VertexBundle(data.position, data.textureCoord, data.indices);
    return this.vertexData.addData(bundle, texture);
  }

  // ARRAY BUFFERS
  configArrayBuffers(){
    this.configVArrayBuffer('position', 'vertexPosition', 3, this.gl.FLOAT);
    this.configVArrayBuffer('textureCoord', 'textureCoord', 2, this.gl.FLOAT);
  }

  configVArrayBuffer(bufferName, attrLocName, numComponents,
                     type=null, normalize=false, stride=0, offset=0){
    let attrLoc = expectValue(
      this.programInfo.attribLocations[attrLocName], 'attrLoc');
    let buffer = expectValue(
      this.buffers[bufferName], 'buffer');
    type ??= this.gl.FLOAT;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.vertexAttribPointer(
        attrLoc,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    this.gl.enableVertexAttribArray(attrLoc);
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
  
  initProjectionMatrix(){
    const projectionMatrix = this.getProjectionMatrix();
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
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
    const modelViewMatrix = this.getModelViewMatrix();
    this.gl.uniformMatrix4fv(
        this.programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
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
    this.makeBuffer('position');
    this.makeBuffer('textureCoord');
    this.makeBuffer('indices');
  }

  bufferDataFromBundler(){
    this.setBufferData('position',
                       new Float32Array(this.vertexData.positions));
    this.setBufferData('textureCoord',
                       new Float32Array(this.vertexData.texCoords));
    this.setBufferData('indices', new Uint16Array(this.vertexData.indices), 
                       this.gl.ELEMENT_ARRAY_BUFFER);
    
  }

  // BUFFER UTIL METHODS (TODO buffer manager?)
  makeBuffer(buf_name=null){
    return (this.buffers[buf_name ?? "_"] = this.makeBufferRaw());
  }

  makeBufferRaw(){
    return this.gl.createBuffer();
  }
  
  makeBufferWithData(buf_name, data, buf_type=null, usage=null){
    let raw_args = this._getMakeBufferWithDataRawArgs(
      buf_name, data, buf_type, usage);
    if(raw_args==null){
      return this.makeBufferWithDataRaw(...raw_args);
    }
    this.makeBuffer(buf_name);
    this.setBufferData(buf_name, data, buf_type, usage);
    return this.buffers[buf_name];
  }

  makeBufferWithDataRaw(data, buf_type=null, usage=null){
    const buf = this.makeBuffer();
    this.setBufferDataRaw(buf, data, buf_type, usage);
    return buf;
  }

  _getMakeBufferWithDataRawArgs(name, data, type, usage){
    if(data==null || isNumber(data)){
      // data not array (must be type or usage) so pass first 3 args to _raw
      return [name, data, type];  
    }
    if(name==null){
      // no name, pass other 3 args to _raw
      return [data, type, usage];
    }
    return null;
  }
  
  setBufferData(buf_name, data, buf_type=null, usage=null){
    let buf = nameOrValue(buf_name, this.buffers, "buffer");
    return this.setBufferDataRaw(buf, data, buf_type, usage);
  }
  
  setBufferDataRaw(buf, data, buf_type=null, usage=null){
    buf_type ??= this.gl.ARRAY_BUFFER;
    usage ??= this.gl.STATIC_DRAW;
    this.gl.bindBuffer(buf_type, buf);
    this.gl.bufferData(buf_type, data, usage);
  }
}


exportAs(Renderer);
