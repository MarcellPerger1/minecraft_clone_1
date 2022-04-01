import {
  // general utils
  exportAs, expectValue, sortCoords, callCallback,
  // webgl
  getGL, glErrnoToMsg, initShaderProgram,
  // file loading
  loadTexture
} from '../utils.js';
import {Loader} from './resource_loader.js';
import {GameComponent} from '../game_component.js';
import {ElementBundler, VertexBundle} from './vertex_bundle.js';


// TODO: implement this so that it works 
// because textures need a reload when they are loaded
// const dynamic = true;
// https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics

// TODO: switch to typescript?
export class Renderer extends GameComponent {
  constructor(game, do_init = true) {
    super(game);
    if (do_init) { this.init(); }
  }

  init() {
    this.nFaults = 0;
    this.textures = {};
    // this.then = null;
    // this.now = null;
    this.camPos = this.cnf.camPos.slice();
    this.cubeRot = 0.0;
    this.camRot = {h: 0.0, v: 0.0};

    this.initGL();
    this.initGLConfig();
    
    this.loader = new Loader(this);
    this.initDone = this.loader.loadResources().then(_result => {
      // todo compile shaders asyncshronously
      this.makeShaders(this.loader.vsSrc, this.loader.fsSrc);
      this.vertexData = new ElementBundler(this.gl, this.textures);
      this.makeBufferData();
      this.initArrayBuffers();
      this.initTextures();
    })
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
    // Clear everything
    this.gl.clearDepth(1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  // DRAW SCENE
  start(){
    this.initDone.then(_result => {
      this.game.start();  /// TODO calling other way round
      // this.registerOnFrame();
    });
  }
  
  // render(now=null){
  //   if(now==null){
  //     return this.registerOnFrame();
  //   }
  //   this.now = now*0.001;
  //   this.then ??= this.now;
  //   this.deltaT = this.now - this.then;
  //   this.renderFrame();
  //   this.then=this.now;
  //   return this.registerOnFrame();
  // }
  
  // registerOnFrame(){
  //   let this_outer = this;
  //   return requestAnimationFrame(now => {this_outer.render(now);});
  // }
  
  renderFrame(){
    this.initFrame();
    this.ki.tick(this.deltaT);
    this.addAllData();
    this.drawAll();
    this.checkGlFault();
  }

  addAllData(){
    this.addCube([-1,-1,-1],[0,0,0], 'grass_top', 'grass_side', 'grass_bottom');
    this.addCube([-1,-1,-1],[-2,0,-2], 'grass_top', 'grass_side', 'grass_bottom');
    this.addCube([-3,-1,-1],[-2,0,0], 'grass_top', 'grass_side', 'grass_bottom');
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
    this.last_error = this.gl.getError();
    if(this.last_error !== this.gl.NO_ERROR){
      this.onGlFault();
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
    type = type ?? this.gl.FLOAT;
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
    return this.vertexData.addData(
        new VertexBundle(
          data.position, data.textureCoord, data.indices
        ),
        texture);
  }

  addCube(p0,p1,top_tex,side_tex,bottom_tex){
    this.addData(this.dataForCubeSides(p0,p1), side_tex);
    this.addData(this.dataForCubeTop(p0,p1), top_tex);
    this.addData(this.dataForCubeBottom(p0,p1), bottom_tex);
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
    // NOTE: only X & Y roation because 
    // Z rotation would flip carera upside down for example
    const amount = this.camPos;
    // NOTEE: IMPORTANT!: does stuff in reverse order!!!
    // eg.: here, matrix will transalate, then rotateY, then rotateX
    mat4.rotateX(m1, m1, this.camRot.v * Math.PI / 180);
    mat4.rotateY(m1, m1, this.camRot.h * Math.PI / 180);
    mat4.translate(m1,     // destination matrix
                   m1,     // matrix to translate
                   amount);  // amount to translate
    return m1;
  }

  // SHADER PROGRAM
  makeShaders(vsSrc, fsSrc){
    this.initProgramInfo(initShaderProgram( this.gl, vsSrc, fsSrc));
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

  makeBuffer(){
    return this.gl.createBuffer();
  }
  
  makeBufferWithData(data/*in eg. Float32Array()*/, buf_type=null, usage=null){
    buf_type = buf_type ?? this.gl.ARRAY_BUFFER;
    usage = usage ?? this.gl.STATIC_DRAW;
    const buf = this.gl.createBuffer();
    this.gl.bindBuffer(buf_type, buf);
    this.gl.bufferData(buf_type, data, usage);
    return buf;
  }

  setBufferData(buf_name, data/*in eg. Float32Array()*/,
                buf_type=null, usage=null){
    buf_type = buf_type ?? this.gl.ARRAY_BUFFER;
    usage = usage ?? this.gl.STATIC_DRAW;
    let buf = expectValue(this.buffers[buf_name], "buffer");
    this.gl.bindBuffer(buf_type, buf);
    this.gl.bufferData(buf_type, data, usage);
  }

  bufferDataFromBundler(){
    this.setBufferData('position',
                       new Float32Array(this.vertexData.positions));
    this.setBufferData('textureCoord',
                       new Float32Array(this.vertexData.texCoords));
    this.setBufferData('indices', new Uint16Array(this.vertexData.indices), 
                       this.gl.ELEMENT_ARRAY_BUFFER);
    
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








