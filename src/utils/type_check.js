export function classOf(v) {
  return v.constructor;
}

export function isString(v){
  return typeof v === 'string' || v instanceof String;
}

export function isObject(x){
  return x.constructor.name === 'Object'
}

export function isNumber(x) {
  return typeof x == 'number' || x instanceof Number;
}
