export function sum(array, initval=0){
  return array.reduce((a,b)=>a+b, initval);
}

export function clamp(v, min, max) {
  return (min!=null && v<min) ? min : ((max!=null && v>max) ? max : v);
}

export function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}