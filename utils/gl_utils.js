export function getGL(canv_id){
  const canvas = document.getElementById("glCanvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (gl == null) {
    let msg = "Unable to initialize WebGL. Your browser or machine may not support it.";
    alert(msg);
    throw new Error(msg);
  }
  return gl;
}

export function glErrnoToMsg(errno, gl=WebGLRenderingContext){
  let lookup = {
    [gl.NO_ERROR]: "gl.NO_ERROR",
    [gl.INVALID_ENUM]: "gl.INVALID_ENUM",
    [gl.INVALID_VALUE]: "gl.INVALID_VALUE",
    [gl.INVALID_OPERATION]: "gl.INVALID_OPERATION",
    [gl.INVALID_FRAMEBUFFER_OPERATION]: "gl.INVALID_FRAMEBUFFER_OPERATION",
    [gl.OUT_OF_MEMORY]: "gl.OUT_OF_MEMORY",
    [gl.CONTEXT_LOST_WEBGL]: "gl.CONTEXT_LOST_WEBGL"
  };
  return lookup[errno];
}


export function initShaderProgram(gl, vsSource, fsSource) {
  const vs = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  return programFromShaders(gl, vs, fs);
}


export function programFromShaders(gl, vs, fs){
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vs);
  gl.attachShader(shaderProgram, fs);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    let msg = (
      'Unable to initialize the shader program: ' 
      + gl.getProgramInfoLog(shaderProgram));
    alert(msg);
    throw new Error(msg);
  }

  return shaderProgram;
}


export function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  // Send the source to the shader object
  gl.shaderSource(shader, source);
  // Compile the shader program
  gl.compileShader(shader);
  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    let etext = 'An error occurred compiling the shaders: ' 
      + gl.getShaderInfoLog(shader);
    alert(etext);
    gl.deleteShader(shader);
    throw new Error(etext);
  }
  return shader;
}


