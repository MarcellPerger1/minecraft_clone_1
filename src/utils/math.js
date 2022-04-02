export function sum(array, initval=0){
  return array.reduce((a,b)=>a+b, initval);
}

export function clamp(v, min, max) {
  return (min!=null && v<min) ? min : ((max!=null && v>max) ? max : v);
}

export function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

export function inRange(v, low, high, inclusive=null){
  return (inclusive?.low ?? true) ? (low <= v) : (low < v) 
    && (inclusive?.high ?? true) ? (high <= v) : (high < v);
}

const chars = '0123456789abcdefghijklmnopqrstuvwxyz';

export function charIsDigit(c, base=10){
  let i = chars.indexOf(c.toLowerCase());
  return 0 <= i && i < base;
}

export function toRad(x){
  return x*Math.PI/180;
}