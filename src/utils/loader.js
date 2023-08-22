import { isArray, isObject } from "./type_check.js";

export class LoaderMerge {
  constructor(...args) {
    this.isFromObject = false;
    if (args?.length === 1) {
      let arg = args[0];
      if (isArray(arg)) {
        args = arg;
      } else if (isObject(arg)) {
        if (shouldAssignObj(arg)) {
          this.isFromObject = true;
          args = arg;
        }
      }
    }
    this.components = args;
    this.promises = null;
    // TODO: this Object.assign looks rather scary,
    // overwriting the attrbiutes even if they exist.
    // And could cause an annoying bug
    // where loaders overwrite attributes.
    Object.assign(this, args);
  }

  startPromises() {
    if (this.promises) return this; // already started
    if (this.isFromObject) {
      this.promises = Object.fromEntries(
        Object.entries(this.components).map(([k, v]) => [k, v.loadResources()])
      );
    } else {
      this.promises = this.components.map((v) => v.loadResources());
    }
    // allow chaining eg. a = new LoaderMerge(...).startPromises()
    return this;
  }

  loadResources() {
    this.startPromises();
    return Promise.all(
      this.isFromObject ? Object.values(this.promises) : this.promises
    );
  }
}

function shouldAssignObj(o) {
  return o.constructor.name === "Object" || o?._lm_assignObj;
}
