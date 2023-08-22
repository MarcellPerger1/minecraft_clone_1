// this module is heavily inspired by lodash's cloneDeep
// but adapted to make it more readable
// and to support merging, not just cloning

import { assert } from "./assert.js";
import { findTypeProto, getOwnProperties } from "./object_utils.js";
import { isAnyObject, isArray, toStringTag } from "./type_check.js";

// EXPORTS
Symbol.dontMerge = Symbol.for("dontMerge");

// typedefs
/**
 * @typedef {Object} deepMergeCnfT
 * @prop {Array<*>} [cnf.weakObjTypes=[Object]]
 * @prop {*} [cnf.protoOverride] override constructor of result
 * @prop {*} [cnf.ctorOverride] override prototype of result
 * @prop {boolean} [cnf.deepSetItems] copy items in Set?
 */

// public functions
/**
 * deep copy and merge some objects
 * @param {Array<*>} objs - Objects to deepmerge
 * @param {deepMergeCnfT} [cnf] - Config
 * @param {Array<*>} [cnf.weakObjTypes=[Object]]
 * @param {*} [cnf.protoOverride] override constructor of result
 * @param {*} [cnf.ctorOverride] override prototype of result
 * @param {boolean} [cnf.deepSetItems] copy items in Set?
 * @param {Map} [memo=null]
 * @returns {*}
 */
export function deepMerge(objs, cnf = null, memo = null) {
  cnf = _applyCnfDefaults(cnf);
  let objs_arg = objs;
  objs = _filterObjs(objs);
  if (!objs.length) {
    return objs_arg.at(-1); // all nullish so return last arg (could throw error?)
  }
  if (!isAnyObject(objs.at(-1))) {
    return objs.at(-1); // primitive so just return it
  }
  _trimObjsList(objs, cnf);
  memo ??= new Map();
  const use_memo = objs.length === 1;
  if (use_memo && memo.has(objs[0])) {
    return memo.get(objs[0]);
  }

  let res = _construct(objs, cnf);
  if (use_memo) {
    memo.set(objs[0], res);
  }
  _setstate(res, objs, cnf, memo);
  return res;
}
export function deepCopy(obj, cnf = null, memo = null) {
  return deepMerge([obj], cnf, memo);
}

// INTERNALS
// arg processing
function _applyCnfDefaults(cnf) {
  cnf ??= {};
  cnf.weakObjTypes ??= [Object, Array];
  return cnf;
}

function _filterObjs(objs) {
  assert(
    isArray(objs),
    "deepMerge first arg must be an array; " +
      "try putting the arguments into an array"
  );
  objs = objs.filter((v) => v != null);
  return objs;
}
function _trimObjsList(objs, _cnf) {
  let lastPrimIndex;
  let i = -1;
  while (++i < objs.length) {
    let o = objs[i];
    if (!isAnyObject(o)) {
      lastPrimIndex = i;
    }
  }
  objs.splice(0, lastPrimIndex + 1);
}

// construct
function _construct(objs, cnf) {
  let proto = _mergeProto(objs, cnf);
  let res = _construct.fromTag(objs.at(-1), proto);
  return res;
}
_construct.fromTag = function constructFromTag(obj, proto) {
  let Ctor = obj.constructor;
  let ttag = toStringTag(obj);
  if (isArray(obj)) {
    return new Ctor(obj.length);
  }
  switch (ttag) {
    case "Number":
    case "String":
    case "Boolean":
    case "Date":
      return new Ctor(obj);
    case "Map":
    case "Set":
      return new Ctor();
    case "Symbol":
      return Object(Symbol.prototype.valueOf.call(obj));
    case "RegExp":
      var res = new obj.constructor(obj.source, obj.flags);
      res.lastIndex = obj.lastIndex;
      return res;
    case "Object":
      return _construct.object(obj, proto);
    case "Function":
      return obj;
  }
  if (ttag.startsWith("HTML")) {
    return obj;
  }
  throw new TypeError(`Don't know how to merge ${ttag} objects`);
};
_construct.object = function constructObject(obj, proto) {
  if (typeof obj.constructor !== "function") {
    return {};
  }
  return Object.create(proto);
};

// setstate
/**
 * Internal, set state on `res` from `objs`
 * @param {object} res
 * @param {object[]} objs
 * @param {object} cnf
 */
function _setstate(res, objs, cnf, memo) {
  let ttag = toStringTag(res);
  if (ttag === "Set") {
    _setstate.setlike(res, objs, cnf, memo);
  } else {
    _setstate.object(res, objs, cnf, memo);
  }
  return res;
}
_setstate.object = function setstate_object(res, objs, cnf, memo) {
  if (_dontMergeObjs(objs)) {
    objs = [{ [Symbol.dontMerge]: true }, objs.at(-1)];
  }
  // for now, copy all own properties
  // TODO: option in cnf
  // dont pollute with Object methods
  let update_with = Object.create(null);
  let update_type = "object";
  for (let o of objs) {
    let this_type = isArray(o) ? "array" : "object";
    if (update_type !== this_type) {
      update_with = Object.create(null);
    }
    update_type = this_type;
    if (this_type == "object") {
      getOwnProperties(o).forEach((k) =>
        (update_with[k] ??= []).push(getItem(o, k))
      );
    } else {
      update_with.length = [
        Math.max(update_with?.length?.[0] ?? -Infinity, o.length),
      ];
      getOwnProperties(o).forEach((k) => {
        if (k === "length") {
          return;
        }
        (update_with[k] ??= []).push(getItem(o, k));
      });
    }
  }
  for (let k of getOwnProperties(update_with)) {
    setItem(res, k, deepMerge(update_with[k], cnf, memo));
  }
};
_setstate.maplike = _setstate.object;
_setstate.setlike = function setstate_setlike(res, objs, cnf, memo) {
  if (_dontMergeObjs(objs)) {
    objs = [objs.at(-1)];
  }
  for (let [i, o] of objs.entries()) {
    if (_dontMerge(o) && i !== objs.length - 1) {
      continue;
    }
    switch (toStringTag(o)) {
      case "Set":
        o.forEach((_v, k) => res.add(_maybeCopy.setItem(k, cnf, memo)));
        break;
      case "Map":
        o.forEach((v, k) =>
          v ? res.add(_maybeCopy.setItem(k, cnf, memo)) : res
        );
        break;
    }
    Object.keys(o).forEach((k) => {
      if (o[k] === undefined) {
        return;
      }
      if (o[k]) {
        res.add(k);
      } else {
        res.remove(k);
      }
    });
  }
};

function getItem(o, k) {
  return toStringTag(o) === "map" ? o.get(k) : o[k];
}
function setItem(o, k, v) {
  toStringTag(o) === "map" ? o.set(k, v) : (o[k] = v);
  return o;
}

function _dontMerge(o) {
  return o?.[Symbol.dontMerge];
}

function _dontMergeObjs(objs) {
  var dontMerge;
  for (const o of objs) {
    dontMerge = _dontMerge(o) ?? dontMerge;
  }
  return dontMerge ?? false;
}

function _maybeCopy(v, cond, cnf, memo) {
  return cond ? deepCopy(v, cnf, memo) : v;
}
// item *in* set
_maybeCopy.setItem = function _copySetItem(si, cnf, memo) {
  return _maybeCopy(si, cnf.deepSetItems, cnf, memo);
};

// protoype handling
function _mergeProto(objs, cnf) {
  // null is a vaild prototype so use '!== undefined'
  if (cnf.protoOverride !== undefined) {
    return cnf.protoOverride;
  }
  // use '!= null' because null is not a vaild constructor
  if (cnf.ctorOverride != null) {
    return cnf.ctorOverride.prototype;
  }

  let weakObjProtos = cnf.weakObjTypes.map(findTypeProto);
  // if only weak protos, use last proto
  let proto = Object.getPrototypeOf(objs.at(-1));

  // iterate backwards
  let i = objs.length;
  while (i-- > 0) {
    let p = Object.getPrototypeOf(objs[i]);
    if (!weakObjProtos.includes(p)) {
      // if encounter non-weak, will override all before so break
      proto = p;
      break;
    }
  }
  return proto;
}
