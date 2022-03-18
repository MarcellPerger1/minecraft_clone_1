import {getGL, loadFile,
        initShaderProgram,
        loadTextureWithCallback} from '../utils.module.js';

import {RendererConfig} from './config.js';
import {exportAs, expectValue,
        sortCoords, glErrnoToMsg} from './utils.js';
import {ElementBundler, VertexBundle} from './vertex_bundle.js';

// var rot = 0.0;
//const cubePos = [0.0, 2.4, 10.0];
//var pos = [0.0, 0.0, 0.0];
// TODO: implement this so that it works 
// because textures need a reload when they are loaded
// const dynamic = true;
// https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics

// TODO: switch to typescript? or use modules? or both!?
export class Renderer {
  constructor(cnf, do_init = true) {
    this.cnf = new RendererConfig(cnf);
    if (do_init) { this.init(); }
  }

  init() {
    this.nFaults = 0;
    this.initGL();
    this.initGLConfig();
    this.loadShaders();
    this.textures = {};
    this.vertexData = new ElementBundler(this.gl, this.textures);
    this.makeBufferData();
    this.initArrayBuffers();
    this.initTextures();
    this.then = 0;
    this.now = null;
    this.camPos = this.cnf.camPos;
    this.cubeRot = 0.0;
    this.camRot = {h: 0.0, v: 0.0};
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
    this.registerOnFrame();
  }
  
  render(now=null){
    if(now==null){
      return this.registerOnFrame();
    }
    this.now = now*0.001;
    this.deltaT = this.now - this.then;
    this.renderFrame();
    this.then=this.now;
    return this.registerOnFrame();
  }
  
  registerOnFrame(){
    let this_outer = this;
    return requestAnimationFrame(now => {this_outer.render(now);});
  }
  
  renderFrame(){
    this.initFrame();
    this.addAllData();
    this.drawAll();
    this.checkGlFault();
  }

  addAllData(){
    this.addCube([-1,-1,-1],[0,0,0], 'grass_top', 'grass_side', 'grass_bottom');
    this.addCube([-1,-1,-1],[-2,0,-2], 'grass_top', 'grass_side', 'grass_bottom');
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
    const modelViewMatrix = mat4.create();
    // NOTE: only X & Y roation because 
    // Z rotation would flip carera upside down for example
    mat4.rotateY(modelViewMatrix, modelViewMatrix, this.camRot.h * Math.PI / 180);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, this.camRot.v * Math.PI / 180);
    const amount = [this.camPos[0]-this.cnf.cubePos[0],
                    this.camPos[1]-this.cnf.cubePos[1],
                    this.camPos[2]-this.cnf.cubePos[2]];
    mat4.translate(modelViewMatrix,     // destination matrix
                   modelViewMatrix,     // matrix to translate
                   amount);  // amount to translate
    return modelViewMatrix;
  }

  // SHADER PROGRAM
  loadShaders() {
    const vsText = loadFile(this.cnf.vsPath);
    const fsText = loadFile(this.cnf.fsPath);
    const shProg = initShaderProgram(this.gl, vsText, fsText);
    this.initProgramInfo(shProg);
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
      0.0,  1.0,
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      // Right
      0.0,  1.0,
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
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
    let this_outer = this;
    this.textures[name] = loadTextureWithCallback(
      this_outer.gl, path,
      function (gl, url, img) {
        this_outer.textures[name].image = img;
        if(callback != null) {
          thisArg = thisArg ?? this_outer;
          callback.call(thisArg, name, url, img);
        }
        this_outer.textures[name].loaded = true;
      }
    )
    this.textures[name].callback = callback;
    this.textures[name].loaded = false;
  }
}


exportAs(Renderer);








