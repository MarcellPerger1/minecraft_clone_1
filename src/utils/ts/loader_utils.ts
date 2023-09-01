export type LoaderT<T = any> = {loadResources(): Promise<T>};
type LoadersToPromisesT<L extends {[k: PropertyKey]: LoaderT}> = {[k in keyof L]: L[k] extends LoaderT<infer RT> ? Promise<RT> : Promise<unknown>};
type LoadersToValuesT<L extends {[k: PropertyKey]: LoaderT}> = {[k in keyof L]: L[k] extends LoaderT<infer RT> ? RT : unknown}

export class LoaderMerge<L extends {[k: PropertyKey]: LoaderT}> {
  loaders: L;
  promises?: LoadersToPromisesT<L>;

  constructor(loaders: L) {
    this.loaders = loaders;
  }

  startPromises(): this {
    // TS can't infer this (probs coz type definitions not good enough)
    // and also can only do the `[k in keyof L]: L[k]` stuff in the object type, not separately
    this.promises = fromEntries(
      getEntries(this.loaders).map(([k, v]) => [k as keyof L, v.loadResources() as any]));
    return this;
  }

  async loadResources() : Promise<LoadersToValuesT<L>> {
    // aargh typescript!!
    this.startPromises();
    const promiseList = getEntries(this.promises! as {[k: PropertyKey]: unknown}).map(async ([k, v]) => [k, await v]) as Promise<[PropertyKey, unknown]>[];
    const results = await Promise.all(promiseList);
    return fromEntries(results) as LoadersToValuesT<L>;
  }
}

// mark attribs normally on `LoaderMerge` as reserved so they aren't
// `Object.assign`-ed and don't overwrite imprortant data (e.g. `.promises`)
const _RESERVED_KEYS = ["loaders", "promises", ...getAllPropNames(new LoaderMerge({}))];

export function makeLoaderMerge<L extends {[k: PropertyKey]: LoaderT}>(loaders: L) : LoaderMerge<L> & L {
  let lm = new LoaderMerge(loaders);
  const lm_loaders = {...lm.loaders};
  for(const k of _RESERVED_KEYS) {
    if(k in lm_loaders) {
      delete lm_loaders[k];
    }
  }
  return Object.assign(lm, lm.loaders);
}


// These are just Object.entries and Object.fromEntries respectively but with better types
function getEntries<KT extends PropertyKey, VT>(o: {[k in KT]: VT}) : [KT, VT][] {
  return Object.entries(o) as [KT, VT][];
}
function fromEntries<KT extends PropertyKey, VT>(entries: [KT, VT][]) : {[k in KT]: VT} {
  return Object.fromEntries(entries) as any;
}

// get all property keys (own and up the prototype chain)
function getAllPropNames(x: Object): Set<string | symbol> {
  var out: Set<string | symbol> = new Set;
  while(x !== null) {
    for(const name of [...Object.getOwnPropertyNames(x), ...Object.getOwnPropertySymbols(x)]) {
      out.add(name);
    }
    x = Object.getPrototypeOf(x);
  }
  return out;
}
