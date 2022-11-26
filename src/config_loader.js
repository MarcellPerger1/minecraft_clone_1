"use strict";
import {
  isPureObject, isObject, isArray, 
  fetchTextFile, 
  trim, 
  deepMerge, 
  removePrefix
} from "./utils.js";
import * as CNF_MOD from "./config.js";


export class LoaderContext {
  constructor(configsRoot="configs") {
    this.configsRoot = configsRoot;
  }
  /**
   * Load .json Config file
   * @param {string} path
   * @param {boolean} inheritance - Use inheritance?
   * @returns {Promise<CNF_MOD.ConfigT>} the loaded config
  */
  async loadConfigFile(path, inheritance = true) {
    let data = parseJsonConfig(await fetchTextFile(path));
    if (inheritance) {
      data = await this.handleConfigInheritance(data);
    }
    return data;
  }

  /**
   * Handle inheritance for Configs
   * @param {{$extends: (string|string[])}} config - the original config
   * @returns {Promise<CNF_MOD.ConfigT>} the new config
  */
  async handleConfigInheritance(config) {
    /** @type {string[]} */
    let bases = config.$extends ?? [];
    if (!isArray(bases)) { bases = [bases]; }
    bases = bases.filter(base => !isComment(base));
    if(!bases.length) { bases = ["default"]; }
    let parents = await Promise.all(
      bases.map(base => this.loadConfigByName(base))
    );
    return deepMerge([...parents, config]);
  }

  async loadConfigByName(/**@type{string}*/name) {
    switch (name) {
      case "default":
        return this.loadConfigDefaults();
      default:
        return this.loadConfigByFilename(name);
    }
  }

  async loadConfigDefaults() {
    return this.loadConfigFile(
      `./${this.configsRoot}/default.json`,
      // IMPORTANT: this is so that no infinite recursion getting defaults for default
      false);
  }

  async loadConfigByFilename(path) {
    return this.loadConfigFile(this.getConfigFilename(path));
  }

  getConfigFilename(/** @type {string} */path) {
    // NOTE: this input *may* eventually come from the user
    // so a bit of security can't hurt
    if (path.includes('..')) {
      throw new ReferenceError("Config paths shouldn't contain '..'");
    }
    path = trim(path, './', { start: true });
    path = path.replaceAll(/\/+/g, '/');  // remove repeated /
    if (!path.endsWith('.json')) { path += '.json'; }
    if(!path.startsWith(`${this.configsRoot}/`)) { path = `${this.configsRoot}/${path}`}
    // './' is to make it work with gh pages
    return './' + path;
  }
}


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
      // prefer 'builtin' symbols over 
      // symbols in the registry ('global' symbols)
      k = Symbol[symbol_name] ?? Symbol.for(symbol_name);
    }
    newval[k] = v;
  }
  return newval;
}

function _getConfigClass(_key, value) {
  let /** @type {string} */ t_str = value?.$class;
  if (!t_str) {
    return null;
  }
  if (!t_str.endsWith("Config")) {
    throw new TypeError("Not a Config class");
  }
  if (t_str.length > 64) {
    throw new RangeError("Config classes should have reasonably short names ;-)");
  }
  let cnf_cls = CNF_MOD[t_str];
  if (!cnf_cls) {
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
export async function loadConfigFile(path, inheritance = true, 
                                     configsRoot="configs") {
  return new LoaderContext(configsRoot).loadConfigFile(path, inheritance);
}
