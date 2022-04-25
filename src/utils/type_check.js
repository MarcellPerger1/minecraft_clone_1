export function classOf(v) {
  return v.constructor;
}

export function isString(v){
  return typeof v === 'string' || v instanceof String;
}

export function isPureObject(x){
  return x.constructor.name === 'Object'
}

export function isObject(x){
  return x && !isArray(x) && x instanceof Object;
}

export function isNumber(x) {
  return typeof x == 'number' || x instanceof Number;
}

export function isArray(x){
  return Array.isArray(x);
}

export function isTypedArray(x){
  return x instanceof TypedArray 
    || (ArrayBuffer.isView(x) && !(x instanceof DataView));
}

export const TypedArray = Object.getPrototypeOf(Uint8Array);

export function isAnyArray(x){
  return isArray(x) || isTypedArray(x);
}

export function isPrimitive(x){
  return Object(x) !== x;
}

export function isFunction(x){
  return typeof x === 'function';
}
