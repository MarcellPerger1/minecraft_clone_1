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

export function assignNullSafe(a, ...args){
  for(const other of args){
    if(other==null){ continue; }
    for(const [k, v] of Object.entries(other)){
      a[k] = v ?? a[k];
    }
  }
  return a;
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

export function forRange(n, func, thisArg=null){
  return Array.from({length: n}, (_v, i) => func.call(thisArg, i));
}

export function fromNested(shape, func, thisArg=null){
  var path = [];
  let inner = (i) => {
    var value;
    path.push(i);
    if(path.length == shape.length){
      value = func.call(thisArg, path.slice());
    } else {
      value = forRange(shape[path.length], inner);
    }
    path.pop();
    return value;
  }
  return forRange(shape[0], inner);
}
