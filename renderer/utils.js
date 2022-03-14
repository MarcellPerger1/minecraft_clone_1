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

