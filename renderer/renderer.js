import {RendererConfig} from './config.js';
import {exportAs} from './utils.js';

var rot = 0.0;
//const cubePos = [0.0, 2.4, 10.0];
var pos = [0.0, 0.0, 0.0];
// TODO: implement this so that it works 
// because textures need a reload when they are loaded
const dynamic = true;

// TODO separate file for the controls!??
function keypress_handler(e){  
  if(e.key == 'w'){
    pos[2] += 1;
  }
  if(e.key == 's'){
    pos[2] -= 1;
  }
  if(e.key == 'a'){
    pos[0] += 1;
  }
  if(e.key == 'd'){
    pos[0] -= 1;
  }
}
addEventListener('keydown', keypress_handler);


// TODO: switch to typescript? or use modules? or both!?
class Renderer {
  constructor(cnf, do_init = true) {
    this.cnf = new RendererConfig(cnf);
    if (do_init) { this.init(); }
  }

  init() {
    this.initGL();
    this.initGLConfig();
    this.loadShaders();
    this.initBuffers();
    this.initTextures();
    this.then = 0;
    this.now = null;
  }

  initGL(){
    this.gl = getGL();
    if(this.gl==null){
      throw new Error("Filed to initiialise gl");
    }
    this.clearCanvas();
  }
  initGLConfig(){
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
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
    this.now = now;
    this.deltaT = this.now - this.then;
    this.renderFrame();
    this.then=now;
    return this.registerOnFrame();
  }
  
  registerOnFrame(){
    let this_outer = this;
    return requestAnimationFrame(now => {this_outer.render(now);});
  }
  
  renderFrame(){
    this.clearCanvas();
    this.gl.useProgram(this.programInfo.program);
    this.setUniforms();
    this.initArrayBuffers();
    this.drawElements();
  }

  // ARRAY BUFFERS
  initArrayBuffers(){
    this.configVArrayBuffer('position', 'vertexPosition', 3, this.gl.FLOAT);
    this.configVArrayBuffer('textureCoord', 'textureCoord', 2, this.gl.FLOAT);
  }

  configVArrayBuffer(bufferName, attrLocName, numComponents,
                     type=null, normalize=false, stride=0, offset=0){
    let attrLoc = this.programInfo.attribLocations[attrLocName];
    let buffer = this.buffers[bufferName];
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

  drawElements(){
    // Tell WebGL we want to affect texture unit 0
    this.gl.activeTexture(this.gl.TEXTURE0);
    // Tell the shader we bound the texture to texture unit 0
    this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
  
    const type = this.gl.UNSIGNED_SHORT;
  
    {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.grass_side);
      const vertexCount = 12;
      const offset = 0;
      this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
    }
    {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.grass_top);
      const vertexCount = 6;
      const offset = 24; // 0 + 12*2 = 24
      this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
    }
    {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.grass_side);
      const vertexCount = 18;
      const offset = 36;  // 24 + 6*2 = 36
      this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
    }
  }
  
  // UNIFORMS
  setUniforms(){
    this.initProjectionMatrix();
    this.initModelViewMatrix();
  }
  
  initProjectionMatrix(){
    const projectionMatrix = this.getProjectionMatrix();
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  }
  getProjectionMatrix(){
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
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
  
    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    const amount = [pos[0]-this.cnf.cubePos[0],
                    pos[1]-this.cnf.cubePos[1],
                    pos[2]-this.cnf.cubePos[2]];
    mat4.translate(modelViewMatrix,     // destination matrix
                   modelViewMatrix,     // matrix to translate
                   amount);  // amount to translate
    //[-0.0, -2.4, -10.0]
    // (Math.PI/180)*
    rot += this.deltaT;
    // 30*(Math.PI/180)
    var rotation = this.cnf.rotate ? rot : 30*(Math.PI/180);
    var axis = this.cnf.rotate ? [1.0, 1.0, 1.0] : [0.0, 1.0, 0.0]
    mat4.rotate(modelViewMatrix,  // dest
                modelViewMatrix,  // src
                rotation, // rotation (rad)
                axis)  // axis
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
  initBuffers(){
    this.buffers = {
      position: this.bufferPositions(),
      textureCoord: this.bufferTextureCoords(),
      indices: this.bufferIndices(),
    };
  }

  bufferPositions(){
    const positionBuffer = this.gl.createBuffer();
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);  
    const positions = this.getPositionData();
    this.gl.bufferData(this.gl.ARRAY_BUFFER,
                  new Float32Array(positions),
                  this.gl.STATIC_DRAW);
    return positionBuffer;
  }
  bufferTextureCoords(){
    const textureCoordinates = this.getTextureCoordData();
    const textureCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER,
                       new Float32Array(textureCoordinates),
                       this.gl.STATIC_DRAW);
    return textureCoordBuffer;
  }
  bufferIndices(){
    const indices = this.getIndexData();
    const indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,
                       new Uint16Array(indices),
                       this.gl.STATIC_DRAW);
    return indexBuffer;
  }

  // BUFFER DATA
  getTextureCoordData(){
    const textureCoordinates = [
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
      // Top
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Bottom
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
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
    ];
    return textureCoordinates;
  }
  getPositionData(){
    const positions = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
  
    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,  
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
  
    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
  
    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
  
    // Right face
     1.0, -1.0, -1.0, 
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
  
    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
    ];
    return positions;
  }
  getIndexData(){
    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
    const indices = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ];
    return indices;
  }

  // TEXTURES
  initTextures(){
    this.textures = {};
    this.loadTexture('grass_top', this.cnf.grassTopPath);
    this.loadTexture('grass_side', this.cnf.grassSidePath);
  }
  
  loadTexture(name, path, callback=null){
    let this_outer = this;
    this.textures[name] = loadTextureWithCallback(
      this_outer.gl, path,
      function (gl, url, img) {
        this_outer.textures[name].image = img;
        if(callback != null) {
          callback.call(this_outer, name, url, img);
        }
        this_outer.textures[name].loaded = true;
      }
    )
    this.textures[name].callback = callback;
    this.textures[name].loaded = false;
  }
}


exportAs(Renderer);








