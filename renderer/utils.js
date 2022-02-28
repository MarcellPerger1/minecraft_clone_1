export function classOf(v) {
  return v.constructor;
}

export function exportAs(obj, name=null){
  name = name ?? obj.name;
  if(name==null){
    console.error("No name");
  }
  window[name] = obj;
}