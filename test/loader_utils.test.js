import { expect, it, describe } from "@jest/globals";

import {LoaderMerge, makeLoaderMerge} from "../src/utils/ts/loader_utils.js";

/**
 * @template {{[k: PropertyKey]: import('../src/utils/ts/loader_utils.d.ts').LoaderT}} L
 * @param {L} loaders 
 * @returns {LoaderMerge<L>}
 */
function ctorLoaderMerge(loaders) {
  return new LoaderMerge(loaders);
}

/**
 * @template T
 * @param {Promise<T>} promise 
 * @returns {import("../src/utils/ts/loader_utils.js").LoaderT<T>}
 */
function makeLoader(promise) {
  return { loadResources() { return promise; } };
}

/**
 * @param {number} millis
 */
async function wait(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

describe.each([
  {name: "LoaderMerge", fn: ctorLoaderMerge},
  {name: "makeLoaderMerge.<return>", fn: makeLoaderMerge}
])("$name", ({fn}) => {
  it("Assigns loaders to the `.loaders` property", () => {
    const loaders = {a: makeLoader(Promise.resolve(9)), b: makeLoader(Promise.resolve("abc"))};
    const lm = fn(loaders);
    expect(lm.loaders).toStrictEqual(loaders);
  });
  describe(".startPromises()", () => {
    it("Returns `this`", () => {
      const loaders = {a: makeLoader(Promise.resolve(9)), b: makeLoader(Promise.resolve("abc"))};
      const lm = fn(loaders);
      expect(lm.startPromises()).toStrictEqual(lm);
    });
    it("Makes the `.promises` property", () => {
      var promiseA = Promise.resolve(9);
      var promiseB = Promise.resolve("abc");
      const loaders = {a: makeLoader(promiseA), b: makeLoader(promiseB)};
      const lm = fn(loaders);
      lm.startPromises();
      expect(lm.promises).toStrictEqual({a: promiseA, b: promiseB});
    });
  });
  describe(".loadResources()", () => {
    it("Returns a promise (is async)", () => {
      const loaders = {a: makeLoader(Promise.resolve(9)), b: makeLoader(Promise.resolve("abc"))};
      const lm = fn(loaders);
      lm.startPromises();
      expect(lm.loadResources()).toBeInstanceOf(Promise);
    });
    it("Resolves (with the correct value) when the single promise is resolved", async () => {
      var /** @type {(value: any) => void} */resolvePromise, promiseDone = false;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      const loaders = {p: makeLoader(promise)};
      const lm = fn(loaders);
      lm.startPromises();
      const outPromise = lm.loadResources();
      outPromise.then(() => { promiseDone = true; });
      await wait(40);
      // check that it doesn't resolve before resources loaded
      expect(promiseDone).toBe(false);
      const resolveWith = {};
      resolvePromise(resolveWith);
      await wait(40);
      // check that it does resolve after resources loaded
      expect(promiseDone).toBe(true);
      const returnValue = await outPromise;
      expect(returnValue).toStrictEqual({p: resolveWith});
      expect(returnValue.p).toBe(resolveWith);
    });
    it("Resolves (with the correct value) only after all promises resolved", async () => {
      var promiseDone = false, /** @type {{a: any, b: any}} */resolveValue;
      /** @type {{[k in ("a" | "b")]: {resolve?: (v: any) => void, value: any}}} */
      const resolvers = {a: {value: {name: "a"}}, b: {value: {name: "b"}}};
      const promises = {
        a: new Promise((resolve) => { resolvers.a.resolve = resolve; }),
        b: new Promise((resolve) => { resolvers.b.resolve = resolve; }),
      };
      const loaders = {a: makeLoader(promises.a), b: makeLoader(promises.b)};
      const lm = fn(loaders);
      lm.startPromises();
      const outPromise = lm.loadResources();
      outPromise.then((v) => { promiseDone = true; resolveValue = v; });
      // None of them done
      await wait(40);
      expect(promiseDone).toBe(false);
      // One is done
      resolvers.a.resolve(resolvers.a.value);
      await wait(40);
      expect(promiseDone).toBe(false);
      // All of them are done => should be resolved
      resolvers.b.resolve(resolvers.b.value);
      await wait(40);
      expect(promiseDone).toBe(true);
      expect(resolveValue).toStrictEqual({a: resolvers.a.value, b: resolvers.b.value});
      expect(resolveValue.a).toBe(resolvers.a.value);
      expect(resolveValue.b).toBe(resolvers.b.value);
    });
  });
  it("Works with no loaders", async () => {
    /** @type {{}} */
    const loaders = {};
    const lm = fn(loaders);
    expect(lm.loaders).toBe(loaders);
    lm.startPromises();
    expect(lm.promises).toStrictEqual({});
    const returnValue = await lm.loadResources();
    expect(returnValue).toStrictEqual({});
  });
});

describe("makeLoaderMerge.<return>", () => {
  it("Assigns loaders to returned object", () => {
    const loaders = {a: makeLoader(Promise.resolve(13.169)), b: makeLoader(Promise.resolve("8910"))};
    const lm = makeLoaderMerge(loaders);
    expect(lm.a).toBe(loaders.a);
    expect(lm.b).toBe(loaders.b);
  });

  it("Doesn't assign blocked properties", () => {
    {
      const loaders = {a: makeLoader(Promise.resolve(13.169)), promises: makeLoader(Promise.resolve("8910"))};
      const lm = makeLoaderMerge(loaders);
      expect(lm.a).toBe(loaders.a);
      expect(lm.promises).toBe(void 0);  // check that it wasn't assigned
    }
    {
      const loaders = {a: makeLoader(Promise.resolve(13.169)), toString: makeLoader(Promise.resolve("8910"))};
      const toString = loaders.toString;
      const lm = makeLoaderMerge(loaders);
      expect(lm.a).toBe(loaders.a);
      expect(lm.toString).not.toBe(toString);  // check that it wasn't assigned
    }
    {
      const loaders = {a: makeLoader(Promise.resolve(13.169)), constructor: makeLoader(Promise.resolve("8910"))};
      const lm = makeLoaderMerge(loaders);
      expect(lm.a).toBe(loaders.a);
      expect(lm.constructor).toBe(LoaderMerge);  // check that it wasn't assigned
    }
  });
  it("Doesn't modify the argument", async () => {
    const promiseA = Promise.resolve("123");
    const promiseB = Promise.resolve(-8.1);
    const loadersOrig = {promises: makeLoader(promiseA), toString: makeLoader(promiseB)};
    const loaders = {...loadersOrig}
    const lm = makeLoaderMerge(loaders);
    expect(loaders).toStrictEqual(loadersOrig);
    lm.startPromises();
    expect(lm.promises).toStrictEqual({promises: promiseA, toString: promiseB});
    const returnValue = await lm.loadResources();
    expect(returnValue).toStrictEqual({promises: "123", toString: -8.1});
  });
});
