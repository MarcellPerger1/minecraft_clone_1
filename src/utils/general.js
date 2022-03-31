export function globExport(obj, name=null){
  name = name??obj.name;
  if(name==null){
    console.error("No name");
  }
  window[name] = obj;
}
export var exportAs = globExport;

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


export function callCallback(callback, thisArg, ...args){
  if(callback!=null){
    if(thisArg==null){
      callback(...args);
    } else{
      callback.call(thisArg, ...args);
    }
  }
}
