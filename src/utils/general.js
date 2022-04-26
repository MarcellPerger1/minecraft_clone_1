import {isString, isFunction} from './type_check.js';
import {assert} from "./assert.js";

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
    console.warn("Name not specified!");
  }
  if(v==null){
    throw new ReferenceError(`${name} must not be null!`);
  }
  return v;
}

export function nameOrValue(v, obj, name=null){
  if(isString(v)){
    return expectValue(obj[v], name==null ? name : name + '(from string)');
  }
  return expectValue(v, name);
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

/**
 * Return an object with all of `keys` set to `value`
 * @template KT, VT
 * @param {Array<KT>} keys
 * @param {VT} value
 * @returns {(Object.<KT, VT> | Map.<KT, VT)}
 */
export function fromKeys(keys, value){
  return Object.fromEntries(keys.map(k => [k, value]));
}

// null-ish if not clone
const clonedFrom = Symbol('clonedFrom');
export function cloneFunction(x){
  assert(isFunction(x));
  var orig = x[clonedFrom] ?? x;
  var res = function(...args) { return orig.apply(this, args); };
  Object.assign(res, orig);
  res[clonedFrom] = orig;
  return res;
}


