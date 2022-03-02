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
    console.error("No name");
  }
  if(v==null){
    throw new ReferenceError(`${name} muat not be null!`);
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
