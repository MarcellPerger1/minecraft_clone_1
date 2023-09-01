export class LoaderMerge {
  loaders;
  promises;
  constructor(loaders) {
    this.loaders = loaders;
  }
  startPromises() {
    // TS can't infer this (probs coz type definitions not good enough)
    // and also can only do the `[k in keyof L]: L[k]` stuff in the object type, not separately
    this.promises = fromEntries(
      getEntries(this.loaders).map(([k, v]) => [k, v.loadResources()])
    );
    return this;
  }
  async loadResources() {
    // aargh typescript!!
    this.startPromises();
    const promiseList = getEntries(this.promises).map(async ([k, v]) => [
      k,
      await v,
    ]);
    const results = await Promise.all(promiseList);
    return fromEntries(results);
  }
}
// mark attribs normally on `LoaderMerge` as reserved so they aren't
// `Object.assign`-ed and don't overwrite imprortant data (e.g. `.promises`)
const _RESERVED_KEYS = [
  "loaders",
  "promises",
  ...getAllPropNames(new LoaderMerge({})),
];
export function makeLoaderMerge(loaders) {
  let lm = new LoaderMerge(loaders);
  const lm_loaders = { ...lm.loaders };
  for (const k of _RESERVED_KEYS) {
    if (k in lm_loaders) {
      delete lm_loaders[k];
    }
  }
  return Object.assign(lm, lm.loaders);
}
// These are just Object.entries and Object.fromEntries respectively but with better types
function getEntries(o) {
  return Object.entries(o);
}
function fromEntries(entries) {
  return Object.fromEntries(entries);
}
// get all property keys (own and up the prototype chain)
function getAllPropNames(x) {
  var out = new Set();
  while (x !== null) {
    for (const name of [
      ...Object.getOwnPropertyNames(x),
      ...Object.getOwnPropertySymbols(x),
    ]) {
      out.add(name);
    }
    x = Object.getPrototypeOf(x);
  }
  return out;
}
