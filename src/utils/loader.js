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
    Object.assign(this, args);
  }

  loadResources() {
    if(this.isFromObject) {
      this.promises = Object.fromEntries(
        Object.entries(this.components).map(([k, v]) => [k, v.loadResources()])
      );
      return Promise.all(Object.values(this.promises));
    } else {
      this.promises = this.components.map((v) => v.loadResources());
      return Promise.all(this.promises);
    }
  }
}

function shouldAssignObj(o) {
  return o.constructor.name === "Object" || o?._lm_assignObj;
}
