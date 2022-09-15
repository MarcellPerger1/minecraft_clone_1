"use strict";
import {
  isPureObject, isObject, isArray, 
  fetchTextFile, 
  trim, 
  deepMerge, 
  removePrefix
} from "./utils.js";
import * as CNF_MOD from "./config.js";


function configJsonReplacer(_key, value) {
  if (value == Infinity) {
    return "Infinity"
  }
  if (value == -Infinity) {
    return "-Infinity";
  }
  if (isObject(value) && !isPureObject(value)) {
    return { $class: value.constructor.name, ...value };
  }
  return value;
}

/**
 * Return if string should be interpretted as comment
 * @param {string} s
 * @returns {boolean}
*/
export function isComment(s){
  // comments: key= $comment | $# | // | /* | #
  return /^\s*(?:\$comment|\/\/|\/\*|\$#|#)/.test(s);
}

function configJsonReviver(key, value) {
  if (isComment(key)) {
    return void 0;
  }
  if (value == "Infinity") {
    return Infinity;
  }
  if (value == "-Infinity") {
    return -Infinity;
  }
  if(isObject(value)){
    value = _withSymbolKeys(value);
  }
  let cnf_cls = _getConfigClass(key, value);
  return cnf_cls ? new cnf_cls(value) : value;
}

function _withSymbolKeys(value){
  let newval = {};
  for(let [k, v] of Object.entries(value)){
    if(k.startsWith('@@')){
      let symbol_name = removePrefix(k, "@@");
      // just use text if symbol not found
      k = Symbol[symbol_name] ?? Symbol.for(symbol_name) ?? k;
    }
    newval[k] = v;
  }
  return newval;
}

function _getConfigClass(_key, value) {
  let /** @type{string} */ t_str;
  if (!(t_str = value?.$class)) {
    return null;
  }
  if (!t_str.endsWith("Config")) {
    throw new TypeError("Not a Config class");
  }
  if (t_str.length > 64) {
    throw new RangeError("Config classes should have reasonably short names ;-)");
  }
  let cnf_cls;
  if (!(cnf_cls = CNF_MOD?.[t_str])) {
    throw new ReferenceError("Cant find config class");
  }
  return cnf_cls;
}

export function parseJsonConfig(/**@type{string}*/text) {
  return JSON.parse(text, configJsonReviver);
}

export function stringifyJsonConfig(obj, space = 2) {
  return JSON.stringify(obj, configJsonReplacer, space);
}

/**
 * Load .json Config file
 * @param {string} path
 * @param {boolean} inheritance - Use inheritance?
 * @returns {Promise<CNF_MOD.ConfigT>} the loaded config
*/
export async function loadConfigFile(path, inheritance = true) {
  let data = parseJsonConfig(await fetchTextFile(path));
  if (inheritance) {
    data = await handleConfigInheritance(data);
  }
  return data;
}

/**
 * Handle inheritance for Configs
 * @param {{$extends: (string|string[])}} config - the original config
 * @returns {Promise<CNF_MOD.ConfigT>} the new config
*/
export async function handleConfigInheritance(config) {
  /** @type {string[]} */
  let bases = config.$extends ?? [];
  if (!isArray(bases)) { bases = [bases]; }
  bases = bases.filter(base => !isComment(base));
  if(!bases.length) { bases = ["default"]; }
  let parents = await Promise.all(
    bases.map(base => loadConfigByName(base))
  );
  return deepMerge([...parents, config]);
}

export async function loadConfigByName(/**@type{string}*/name) {
  switch (name) {
    case "default":
      return loadConfigDefaults();
    default:
      return loadConfigByFilename(name);
  }
}

export async function loadConfigDefaults() {
  return loadConfigFile(
    "./configs/default.json",
    // IMPORTANT: this is so that no infinite recursion getting defaults for default
    false);
}

export async function loadConfigByFilename(path) {
  return loadConfigFile(getConfigFilename(path));
}

function getConfigFilename(/** @type {string} */path) {
  // NOTE: this input *may* eventually come from the user
  // so a bit of security can't hurt
  if (path.includes('..')) {
    throw new ReferenceError("Config paths shouldn't contain '..'");
  }
  path = trim(path, './', { start: true });
  path = path.replace(/\/+/, '/');  // remove repeated /
  if (!path.endsWith('.json')) { path += '.json'; }
  // './' is to make it work with gh pages
  return './' + (path.startsWith("configs/") ? path : 'configs/' + path);
}

