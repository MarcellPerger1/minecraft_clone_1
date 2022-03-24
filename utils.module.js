export function classOf(v) {
  return v.constructor;
}

export function exportAs(obj, name=null){
  name = name??obj.name;
  if(name==null){
    console.error("No name");
  }
  window[name] = obj;
}

export function expectValue(v, name=null){
  name = name ?? v?.name;
  if(name==null){
    throw new ReferenceError("Name not specified!")
  }
  if(v==null){
    throw new ReferenceError(`${name} must not be null!`);
  }
  return v;
}

export function isString(v){
  return typeof v === 'string' || v instanceof String;
}

export function sortCoords(p0, p1){
  let len = p0.length;
  if(p0.length != p1.length){
    throw new RangeError("Arrays must be same len");
  }
  for(let i=0;i<len;i++){
    if(p0[i] > p1[i]){
    [p0[i], p1[i]] = [p1[i], p0[i]];
  }
  }
  return [p0, p1];
}

// export function objUpdate(target, ...args){
//   for(const o of args){
//     if(o!=null){
//       for(const [k, v] of Object.entries()){
//         if(v!=null){
//           target[k] = v;
//         }
//       }
//     }
//   }
//   return target;
// }

// may modify list inplace, but doesnt have to
export function iextend(a, b){
  if(b.length < 32_000){
    a.push(...b);
    return a;
  }
  if(a.length < b.length/2){
    // a much smaller than b -  use concat (copy not too expensive)
    return a.concat(b);
  }
  if(b.length < a.length/2){
    // b much smaller - just use a loop
    for(const v of b){
      a.push(v);
    }
    return a;
  }
  return a.concat(b);
}

export function isObject(x){
  return x.constructor.name === 'Object'
}

export function WExportsAs(...args){
  if(args.length == 2 && isString(args[1]) || args.length == 1 ){
    return exportAs(...args);
  }
  if((args.length & 1 == 0) && args.every((v, i) => i & 1 == 0 || isString(i)))
  for(let arg of args){
    if(arg == null){
      continue;
    }
    else if(Array.isArray(arg)){
      exportAs(...arg);
    }
    else if(isObject(arg)){
      for(const [k, v] of Object.entries()){
        // if both string, key is name
        if(isString(k)){
          exportAs(v, k);
        } else if(isString(v)){
          // v is the name
          exportAs(k, v)
        }
        else{
          throw new Error("Where is the key?")
        }
      }
    }
    else{
      exportAs(arg);
    }
  }
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


export function alertLog(...args){
  console.log(...args);
  alert(sum(args, ''));
}

export function alertLogError(etype, ...args){
  console.error(...args);
  var s = sum(args, '');
  alert(s);
  throw new etype(args);
}


export function sum(array, initval=0){
  return array.reduce((a,b)=>a+b, initval);
}


export function clamp(v, min, max) {
  return (min!=null && v<min) ? min : ((max!=null && v>max) ? max : v);
}

export function getGL(){
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (gl == null) {
    alertLogError("Unable to initialize WebGL. Your browser or machine may not support it.");
    return null;
  }
  return gl;
}

// Load text for source from <script> element id
export function loadSrc(id){
  const vse = document.getElementById(id);
  return vse.innerText;
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
export function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alertLogError('Unable to initialize the shader program: ' 
                  + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
export function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alertLog('An error occurred compiling the shaders: ' 
                  + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('An error occurred compiling the shaders: ' 
                    + gl.getShaderInfoLog(shader));
  }

  return shader;
}


//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
export function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array ([255, 0, 255, 255]);


  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);
  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn off mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

// TODO: thisArg = 
export function loadTextureWithCallback(gl, url, callback=null){
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array ([255, 0, 255, 255]);

  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);
  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    if(callback!=null){
      // throw all the data at the callback function
      callback(gl, url, image);
    }
  };
  image.src = url;

  return texture;
}

export function loadTextureWithInfo(gl, url, callback=null, thisArg=null){
  thisArg = thisArg ?? this;
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array ([255, 0, 255, 255]);

  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);
  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    if(callback!=null){
      // throw all the data at the callback function
      callback.call(thisArg, gl, url, image);
    }
  };
  image.src = url;

  return texture;
}


export function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

// TODO!!! - use async=true - sync is deprecated
export function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
  }
  if(result==null){
    alertLogError(Error, "failed to load file: ", filePath);
  }
  return result;
}


export function configVertexArrayBuffer(gl, buffer, attribLoc,
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


export function extendNullSafe(a, ...args){
  for(const other of args){
    if(other==null){ continue; }
    for(const v of other){
      if(v==null){ continue; }
      a.push(v);
    }
  }
  return a;
}