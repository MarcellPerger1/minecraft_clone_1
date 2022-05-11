"use strict";
import {isPureObject, isObject} from "./utils.js";
import * as CNF_MOD from "./config.js";


function configJsonReplacer(_key, value){
  if (value == Infinity){
    return "Infinity"
  }
  if(isObject(value) && !isPureObject(value)){
    return {$class: value.constructor.name, ...value};
  }
  return value;
}

function configJsonReviver(key, value){
  // comments: key= $comment | $# | // | /*
  if(/^\s+(?:\$comment|\/\/|\/\*|\$#|#)/.test(key)){
    return void 0;
  }
  if(value == "Infinity"){
    return Infinity;
  }
  let cnf_cls = _getConfigClass(key, value);
  return cnf_cls ? new cnf_cls(value) : value;
}

function _getConfigClass(_key, value){
  let /** @type{string} */ t_str;
  if(!(t_str=value?.$class)){
    return null;
  }
  if (!t_str.endsWith("Config")){
    throw new TypeError("Not a Config class");
  }
  if(!t_str.length > 64) {
    throw new RangeError("Config classes should have reasonably short names ;-)");
  }
  let cnf_cls;
  if(!(cnf_cls=CNF_MOD?.[t_str])){
    throw new ReferenceError("Cant find config class");
  }
  return cnf_cls;
}

export function parseJsonConfig(/**@type{string}*/text){
  return JSON.parse(text, configJsonReviver);
}

export function stringifyJsonConfig(obj, space=2){
  return JSON.stringify(obj, configJsonReplacer, space);
}

// function _toCamelCase(/** @type {string}*/s){
//   return s.replace(/(?:[_\-]|^)([A-Za-z])([A-Za-z]+)/)
// }
