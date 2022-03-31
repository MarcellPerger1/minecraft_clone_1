import {callCallback} from "./general.js";
import {isPowerOf2} from "./math.js";


export function getGL(canv_id="glCanvas"){
  const canvas = document.getElementById(canv_id);
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


export class TextureLoadInfo{
  constructor(gl, url, image, texture){
    this.gl = gl;
    this.url = url;
    this.image = image;
    this.texture = texture;
  }
}


export const INITIAL_TEX_ARR = [
  255, 0, 255, 255,    0,   0,   0, 255,
  0,   0,   0, 255,    255, 0, 255, 255
];
export const INITIAL_TEX_DATA = new Uint8Array(INITIAL_TEX_ARR);

export const INITIAL_TEX_SIZE = [2, 2];


export function loadTexture(gl, url, callback=null, thisArg=null){
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a placeholder in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  // TODO: perhaps only start game once images loaded
  const internFmt = gl.RGBA;
  const srcFmt = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const level = 0;  // mipmap level
  var [width, height] = INITIAL_TEX_SIZE;
  
  gl.texImage2D(
    /*target*/gl.TEXTURE_2D,
    level, internFmt,
    width, height, 
    /*border (must be 0)*/0,
    srcFmt, srcType,
    INITIAL_TEX_DATA
  );
  setTexParams(gl, width, height);
  
  const image = new Image();
  var texLoadInfo = new TextureLoadInfo(gl, url, image, texture);
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internFmt,
                  srcFmt, srcType, image);
    width = image.width;
    height = image.height;
    setTexParams(gl, width, height);
    callCallback(callback, thisArg, texLoadInfo);
  }
  image.src = url;
  return texLoadInfo;
}


function setTexParams(gl, w, h){
  // WebGL1 has different requirements for power of 2 images
  // vs non power of 2 images so check if the image is a
  // power of 2 in both dimensions.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  if (isPowerOf2(w) && isPowerOf2(h)) {
     // Yes, it's a power of 2. Generate mips.
     gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    // No, it's not a power of 2. Turn off mips and set
    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
}
