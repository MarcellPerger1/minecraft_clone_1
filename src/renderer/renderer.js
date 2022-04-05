import {
  // general utils
  exportAs, expectValue, nameOrValue, sortCoords, callCallback,
  toRad,
  //type checking
  isNumber,
  // webgl
  getGL, glErrnoToMsg, initShaderProgram,
  // file loading
  loadTexture
} from '../utils.js';
import {ShaderLoader} from './shader_loader.js';
import {CubeData} from './cube_data.js';
import {GameComponent} from '../game_component.js';
import {ElementBundler, VertexBundle} from './vertex_bundle.js';
import {Blocks} from '../world.js';

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
    
    this.loader = new ShaderLoader(this.game, this.gl);
  }

  get camRot(){
    return this.player.rotation;
  }
  get camPos(){
    return this.player.position;
  }

  // Returns Promise that fulfilles when all resources loaded and ready for a render
  loadResources(){
    this.initTextures();
    this.initDoneProm = this.loader.loadResources().then(_result => {
      this.onResourcesLoaded();
    });
    return this.initDoneProm;
  }

  onResourcesLoaded(){
    this.initProgramInfo(this.loader.program);
    this.gl.useProgram(this.programInfo.program);
    this.vertexData = new ElementBundler(this.gl, this.textures);
    this.makeBufferData();
    this.initArrayBuffers();
  }

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
  clearCanvas() {
    this.gl.clearColor(...this.cnf.bgColor);
    // Clear depth buffer to 1.0
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

  addWorldData(){
    for(const [pos, block] of this.world){
      if(block==Blocks.grass){
        this.addGrassBlock(pos);
      }
    }
  }

  addGrassBlock(pos){
    this.addGrassCube(pos, vec3.add([], pos, [1,1,1]));
  }

  addGrassCube(start, end){
    this.addCube(start, end, 'grass_top', 'grass_side', 'grass_bottom');
  }

  initFrame(){
    this.resetRender();
    this.setUniforms();
  }

  drawAll(){
    this.vertexData.finalise();
    this.bufferDataFromBundler();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    this.vertexData.drawElements();
  }

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

  resetRender(){
    this.offset = 0;
    this.clearCanvas();
    this.gl.useProgram(this.programInfo.program);
    this.vertexData.reset();
  }

  // ARRAY BUFFERS
  initArrayBuffers(){
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

  addData(data, texture){
    let bundle = new VertexBundle(data.position, data.textureCoord, data.indices);
    return this.vertexData.addData(bundle, texture);
  }

  addCube(p0,p1,top_tex,side_tex,bottom_tex){
    let cData = new CubeData(p0, p1);
    this.addData(cData.sides(p0,p1), side_tex);
    this.addData(cData.top(p0,p1), top_tex);
    this.addData(cData.bottom(p0,p1), bottom_tex);
  }
  
  // UNIFORMS
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
    const fieldOfView = 45 * Math.PI / 180;   // in radians
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
    const modelViewMatrix = this.getModelViewMatrix(this.deltaT);
    this.gl.uniformMatrix4fv(
        this.programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
  }
  getModelViewMatrix(){
    var m1 = mat4.create();
    const amount = vec3.scale([], this.camPos.slice(), -1);
    // NOTEE: IMPORTANT!: does stuff in reverse order!!!
    // eg.: here, matrix will transalate, then rotateY, then rotateX
    mat4.rotateX(m1, m1, this.camRot.v * Math.PI / 180);
    mat4.rotateY(m1, m1, toRad(this.camRot.h + 180));
    mat4.translate(m1, m1, amount);
    return m1;
  }

  // SHADER PROGRAM
  makeShaders(vsSrc, fsSrc){
    this.initProgramInfo(initShaderProgram(this.gl, vsSrc, fsSrc));
    this.gl.useProgram(this.programInfo.program);
  }
  
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
  }

  // BUFFERS
  makeBufferData(){
    this.buffers = {
      position: this.makeBuffer(),
      textureCoord: this.makeBuffer(),
      indices: this.makeBuffer(),
    };
  }

  bufferDataFromBundler(){
    this.setBufferData('position',
                       new Float32Array(this.vertexData.positions));
    this.setBufferData('textureCoord',
                       new Float32Array(this.vertexData.texCoords));
    this.setBufferData('indices', new Uint16Array(this.vertexData.indices), 
                       this.gl.ELEMENT_ARRAY_BUFFER);
    
  }

  // BUFFER UTIL METHODS
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

  // DATA FOR BUFFERS
  dataForCubeSides(p0, p1){
    sortCoords(p0, p1);
    const [x0, y0, z0] = p0;
    const [x1, y1, z1] = p1;
    const sides = {'position': [
    // Front face
    x0, y0, z1,
    x1, y0, z1,
    x1, y1, z1,
    x0, y1, z1,
  
    // Back face
    x0, y0, z0,
    x0, y1, z0,  
    x1, y1, z0,
    x1, y0, z0,
  
    // Right face
    x1, y0, z0, 
    x1, y1, z0,
    x1, y1, z1,
    x1, y0, z1,
  
    // Left face
    x0, y0, z0,
    x0, y0, z1,
    x0, y1, z1,
    x0, y1, z0,
    ], 'textureCoord':[
      // Front
      0.0,  1.0,
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
      // Back
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
      0.0,  1.0,
      // Right
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
      0.0,  1.0,
      // Left
      0.0,  1.0,
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
    ], 'indices':[
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // right
      12, 13, 14,     12, 14, 15,   // left
    ]};
    return sides;
  }
  
  dataForCubeTop(p0, p1){
    sortCoords(p0, p1);
    const [x0, _y0, z0] = p0;
    const [x1, y1, z1] = p1;
    const ret = {'position': [
      x0, y1, z0,
      x0, y1, z1,
      x1, y1, z1,
      x1, y1, z0,
    ],'textureCoord':[
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
    ],'indices':[
      0, 1, 2,     0, 2, 3,   // top
    ]};
    return ret;
  }
  
  dataForCubeBottom(p0, p1){
    sortCoords(p0, p1);
    const [x0, y0, z0] = p0;
    const [x1, _y1, z1] = p1;
    const ret = {'position': [
      x0, y0, z0,
      x1, y0, z0,
      x1, y0, z1,
      x0, y0, z1,
    ],'textureCoord':[
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
    ],'indices':[
      0, 1, 2,     0, 2, 3,   // bottom
    ]};
    return ret;
  }
  
  posDataForCube(p0, p1){
    sortCoords(p0, p1);
    const [x0, y0, z0] = p0;
    const [x1, y1, z1] = p1;
    const positions = [
    // Front face
    x0, y0, z1,
    x1, y0, z1,
    x1, y1, z1,
    x0, y1, z1,
  
    // Back face
    x0, y0, z0,
    x0, y1, z0,  
    x1, y1, z0,
    x1, y0, z0,
  
    // Top face
    x0, y1, z0,
    x0, y1, z1,
    x1, y1, z1,
    x1, y1, z0,
  
    // Bottom face
    x0, y0, z0,
    x1, y0, z0,
    x1, y0, z1,
    x0, y0, z1,
  
    // Right face
    x1, y0, z0, 
    x1, y1, z0,
    x1, y1, z1,
    x1, y0, z1,
  
    // Left face
    x0, y0, z0,
    x0, y0, z1,
    x0, y1, z1,
    x0, y1, z0,
    ];
    return positions;
  }

  // TEXTURES
  initTextures(){
    this.loadTexture('grass_top', this.cnf.grassTopPath);
    this.loadTexture('grass_side', this.cnf.grassSidePath);
    this.loadTexture('grass_bottom', this.cnf.grassBottomPath);
  }

  loadTexture(name, path, callback=null, thisArg=null){
    this.textures ??= {};
    let info = loadTexture(this.gl, path, (_texInfo) => {
      // everythin else already in info object that is automatically updated
      this.textures[name].loaded = true;
      callCallback(callback, thisArg);
    }, this);
    this.textures[name] = info.texture;
    this.textures[name].info = info;
    this.textures[name].loaded = false;
  }
}


exportAs(Renderer);
