//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context

var rot = 0.0;
const cubePos = [0.0, 2.4, 10.0];
var pos = [0.0, 0.0, 0.0];
var bgColor = [0.5, 0.86, 1.0, 1.0]


// MAIN
function main() {
  if (!(gl = getGL())) {
    return;
  }
  const programInfo = initProgram(gl);
  const buffers = initBuffers(gl);
  var textures = {}
  textures.grass = loadTexture(gl, 'textures/grass-side-5.jpg');
  textures.grass_top = loadTexture(gl, 'textures/grass-top-5.jpg')

  var then = 0;
  function render(now){
    now *= 0.001;
    deltaT = now - then;
    then = now;
    drawScene(gl, programInfo, buffers, textures, deltaT);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
addEventListener('load', main);

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

function drawScene(gl, programInfo, buffers, textures, deltaT) {
  resetGlCanvas(gl);
  gl.useProgram(programInfo.program);
  setUniforms(gl, programInfo, deltaT);
  initArrayBuffers(gl, programInfo, buffers);
  drawElements(gl, programInfo, buffers, textures);
}

function resetGlCanvas(gl){
  gl.clearColor(...bgColor);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// UNIFORMS
function setUniforms(gl, programInfo, deltaT){
  initProjectionMatrix(gl, programInfo);
  initModelViewMatrix(gl, programInfo, deltaT);
}

function initModelViewMatrix(gl, programInfo, deltaT){
  const modelViewMatrix = getModelViewMatrix(deltaT);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);
}
function getModelViewMatrix(deltaT){
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  amount = [pos[0]-cubePos[0], pos[1]-cubePos[1], pos[2]-cubePos[2]];
  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 amount);  // amount to translate
  //[-0.0, -2.4, -10.0]
  // (Math.PI/180)*
  rot += deltaT;
  mat4.rotate(modelViewMatrix,  // dest
              modelViewMatrix,  // src
              30*(Math.PI/180),              // rotation (rad)
              [0.0, 1.0, 0.0])  // axis
  return modelViewMatrix;
}

function initProjectionMatrix(gl, programInfo){
  const projectionMatrix = getProjectionMatrix();
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
}
function getProjectionMatrix(){
  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
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

// VERTEX ATTRIBUTES
function initArrayBuffers(gl, programInfo, buffers){
  configVertexArrayBuffer(
    gl, buffers.position,
    programInfo.attribLocations.vertexPosition,
    3, gl.FLOAT
  );
  // configVertexArrayBuffer(
  //   gl, buffers.color,
  //   programInfo.attribLocations.vertexColor,
  //   4, gl.FLOAT
  // );
  configVertexArrayBuffer(
    gl, buffers.textureCoord,
    programInfo.attribLocations.textureCoord, 
    2, gl.FLOAT);
  
}
function configVertexArrayBuffer(gl, buffer, attribLoc,
                                 numComponents, type=null,
                                 normalize=false, stride=0, offset=0) {
  if(type==null){
    type = gl.FLOAT;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(
      attribLoc,
      numComponents,
      type,
      normalize,
      stride,
      offset);
  gl.enableVertexAttribArray(attribLoc);
}

// ELEMENT BUFFER
function drawElements(gl, programInfo, buffers, textures){
  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  const type = gl.UNSIGNED_SHORT;

  {
    gl.bindTexture(gl.TEXTURE_2D, textures.grass);
    const vertexCount = 12;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
  {
    gl.bindTexture(gl.TEXTURE_2D, textures.grass_top);
    const vertexCount = 6;
    const offset = 24; // 0 + 12*2 = 24
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
  {
    gl.bindTexture(gl.TEXTURE_2D, textures.grass);
    const vertexCount = 18;
    const offset = 36;  // 24 + 6*2 = 36
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
  // {
  //   gl.bindTexture(gl.TEXTURE_2D, textures.grass);
  //   const vertexCount = 6;
  //   const offset = 36;
  //   gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  // }
  // {
}

// SHADER PROGRAM //
function initProgram(gl){
  const vsSrc = loadFile('shaders/vertex-shader.glsl');
  const fsSrc = loadFile('shaders/fragment-shader.glsl');
  const shProg = initShaderProgram(gl, vsSrc, fsSrc);
  const programInfo = getProgramInfo(shProg);
  return programInfo;
}
function getProgramInfo(shaderProgram) {
  
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      //vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };
  return programInfo;
}


// BUFFERS //
function initBuffers(gl) {
  positionBuffer = bufferPositions(gl);
  textureCoordBuffer = bufferTextureCoords(gl);
  //colorBuffer = bufferColors(gl);  
  indexBuffer = bufferIndices(gl);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    // color: colorBuffer,
    indices: indexBuffer,
  };
}

function bufferPositions(gl){
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.

  const positions = getPositionData();
  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(positions),
                gl.STATIC_DRAW);
  return positionBuffer;
}
function getPositionData(){
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

function bufferIndices(gl){
  const indices = getIndexData();

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  // Now send the element array to GL
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  return indexBuffer;
}
function getIndexData(){
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

function bufferColors(gl, version=2){
  colors = getColorData(version);
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  return colorBuffer;
}
function getColorData(version=2){
  {
    // same color faces
    const faceColors = [
      [1.0,  1.0,  1.0,  1.0],    // Front face: white
      [1.0,  0.0,  0.0,  1.0],    // Back face: red
      [0.0,  1.0,  0.0,  1.0],    // Top face: green
      [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
      [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
      [1.0,  0.0,  1.0,  1.0],    // Left face: purple
    ];
    // Convert the array of colors into a table for all the vertices.
    var colors1 = [];
    for (var j = 0; j < faceColors.length; ++j) {
      const c = faceColors[j];
      // Repeat each color four times for the four vertices of the face
      colors1 = colors1.concat(c, c, c, c);
    }
  }
  {
    // full custom colors
    const colors2_nested = [
      // Front face
      [1.0,  1.0,  1.0,  1.0],
      [1.0,  1.0,  1.0,  1.0],
      [1.0,  1.0,  1.0,  1.0],
      [1.0,  1.0,  1.0,  1.0],
      // Back face
      [1.0,  0.0,  0.0,  1.0],
      [1.0,  0.0,  0.0,  1.0], 
      [1.0,  0.0,  0.0,  1.0],  
      [1.0,  0.0,  0.0,  1.0],
      // Top face
      [0.0,  1.0,  0.0,  1.0], 
      [0.0,  1.0,  0.0,  1.0],
      [0.0,  1.0,  0.0,  1.0],
      [0.0,  1.0,  0.0,  1.0],  
      // Bottom face
      [0.0,  0.0,  1.0,  1.0],
      [0.0,  0.0,  1.0,  1.0],
      [0.0,  0.0,  1.0,  1.0],
      [0.0,  0.0,  1.0,  1.0],
      // Right face
      [1.0,  1.0,  0.0,  1.0],
      [1.0,  1.0,  0.0,  1.0],
      [1.0,  1.0,  0.0,  1.0],
      [1.0,  1.0,  0.0,  1.0],
      // Left face
      [1.0,  0.0,  1.0,  1.0],
      [1.0,  0.0,  1.0,  1.0],
      [1.0,  0.0,  1.0,  1.0],
      [1.0,  0.0,  1.0,  1.0],
    ]
    var colors2 = [];
    for (arr of colors2_nested){
      colors2 = colors2.concat(...arr)
    }
  }

  return version == 2 ? colors2 : colors1;
}

function bufferTextureCoords(gl){
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  textureCoordinates = getTextureCoordData();
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);
  return textureCoordBuffer;
}

function getTextureCoordData(){
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


