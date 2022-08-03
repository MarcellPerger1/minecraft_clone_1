import { deepMerge, deepCopy } from "../src/utils/deep_merge.js";

const BIGINT_PLUS = 61617349738546589193737113n;
const BIGINT_MINUS = -64547771112849427272721n;
const SYM_BUILTIN = Symbol.unscopables;
const SYM_FOR = Symbol.for('__symbol_for')
const SYM_UNIQUE = Symbol("unique_symbol")

const MERGE_IN_ARRAY = true;

describe("deep_merge.js", () => {
  describe.each([
    {
      copier: (o, cnf) => deepMerge([o], cnf),
      name: "Single-arg deepMerge",
      id: "deepMerge"
    }, {
      copier: deepCopy,
      name: "deepCopy",
      id: "deepCopy"
    }, {
      copier: (o, cnf) => deepMerge([null, void 0, o, null, void 0], cnf),
      name: "deepMerge with some nulls",
      id: "withNulls"
    }
    /* eslint-disable-next-line jest/valid-describe-callback */
  ])("$name", test_deepCopy);
  /* eslint-disable-next-line jest/valid-describe-callback */
  describe("deepMerge mutli-arg", test_deepMerge);
})

function test_deepCopy({ copier, id }) {
  describe("Shallow primitive handling", () => {
    it.each([
      { name: "boolean", data: [true, false] },
      { name: "numbers", data: [0, -12, 9.7, NaN, Infinity] },
      {
        name: "bigint", data: [
          0n, 6543n, -8383n, BIGINT_MINUS, BIGINT_PLUS
        ]
      },
      { name: "strings", data: ["", "abc", "\x1b[0m\\+)"] },
      { name: "booleans", data: [true, false] },
      {
        name: "null-ish", data: [null, void 0],
        skip: (_d) => id === "withNulls"
      },
      {
        name: "symbols", data: [
          SYM_BUILTIN, SYM_UNIQUE, Symbol.for('_test_')
        ]
      }
    ])("Returns $name directly", (obj) => {
      _runOnData(obj, (d) => {
        expect(copier(d)).toBe(d);
      });
    });
  });
  describe("Shallow Array handling", () => {
    it.each([
      { name: "empty array", data: [] },
      { name: "array with one elmenent", data: ["something"] },
      {
        name: "array with some elements", data: [
          1, "str", -9.12, 7n, SYM_UNIQUE, true
        ]
      },
      {
        name: "array with some nulls", data: [
          null, SYM_UNIQUE, 86, false, void 0, "v"
        ]
      },
      /* eslint-disable no-sparse-arrays */
      { name: "empty sparse array", data: new Array(1000) },
      { name: "sparse array at end", data: [9, "e", SYM_UNIQUE, , , ,] },
      { name: "sparse array at start", data: [, , , 5, SYM_UNIQUE, -7n, false, null] },
      { name: "very sparse array", data: [, , void 0, -2n, , , null, , ,] }
      /* eslint-enable no-sparse-arrays */
    ])("$name", ({ data }) => {
      let arr = data;
      let arr2 = copier(arr);
      expect(arr === arr2).toBe(false);
      expect(arr2).toStrictEqual(arr);
      expect(arr2.constructor).toBe(Array);
      expect(arr2).toHaveLength(arr.length);
      for (let i = 0; i < data.length; i++) {
        expect(i in arr).toEqual(i in arr2);
      }
    });
  });
  describe("Shallow Object handling", () => {
    it.each([
      { name: "empty object", data: {} },
      { name: "object with single attr", data: { y: SYM_UNIQUE } },
      { name: "object with string keys", data: { e: 9, HellowWorld: -7373n, u: "r" } },
      { name: "object with Some nulls", data: { o: null, v: false, sm: void 0 } },
      { name: "object with Symbol keys", data: { [SYM_BUILTIN]: true, [SYM_UNIQUE]: 9, [SYM_FOR]: false } },
      { name: "object with mixed keys", data: { [SYM_UNIQUE]: SYM_UNIQUE, aB: 9 } },
    ])("$name", ({ data }) => {
      let obj = data;
      let obj2 = copier(obj);
      expect(obj === obj2).toBe(false);
      expect(obj2).toStrictEqual(obj);
      expect(obj2.constructor).toBe(Object);
    });
    it("Preserves .keys", () => {
      let obj = { a: void 0, b: undefined, c: false, d: 0, e: "other values" };
      let obj2 = copier(obj);
      expect(obj == obj2).toBe(false);
      expect(obj2).toStrictEqual(obj);
      expect(Object.keys(obj2)).toStrictEqual(Object.keys(obj));
    });
  });
  describe("Deep object handling", () => {
    let testData = [
      { name: "object containing array", data: { a: [-8n, "str", 67.1], b: SYM_UNIQUE, a2: [89, undefined] } },
      { name: "object containing object", data: { o: { p: 9, q: "str" }, o2: { o: { e: 2.7, pi: 3.14, t: "math" }, v: "9f" } } },
      { name: "array containing array", data: [[8.3, -9n, "s", [2]], false, [], "3"] },
      { name: "array continaing object", data: [{ u: 9, p: "st" }, "f", { [SYM_BUILTIN]: NaN }], },
      { name: "mixed object", data: [{ e: [{ w: "o", h: -3n }, 1.901], [SYM_UNIQUE]: true }, [], null, 0, [{ r0: "ef", h: void 0 }, SYM_UNIQUE]], }
    ]
    it.each(testData)("Returns equal object: $name", ({ data }) => {
      let obj2 = copier(data);
      expect(obj2 === data).toBe(false);
      expect(obj2).toStrictEqual(data);
    });
    it("Is deep", () => {
      let obj = { a: [2, { u: 9 }] };
      let obj2 = copier(obj);
      expect(obj2).toStrictEqual(obj);
      expect(obj2).not.toBe(obj);
      expect(obj2.a).not.toBe(obj.a);
      expect(obj2.a).toStrictEqual(obj.a);
      expect(obj2.a[1]).not.toBe(obj.a[1]);
      expect(obj2.a[1]).toStrictEqual(obj.a[1]);
    });
    it("Copies objects only once (uses memo)", () => {
      let inner = {};
      let obj = [inner, inner];
      let obj2 = copier(obj);
      expect(obj2[0]).toBe(obj2[1]);
    })
    it("Handles recursive objects (uses memo)", () => {
      let obj = {};
      obj.a = obj;
      let obj2 = copier(obj);
      expect(obj2.a).toBe(obj2);
    });
  })
}


function test_deepMerge(){
  it("Doesn't modify inputs", () => {
    let objs = [{ a: "a1" }, { b: -9, a: "a2" }];
    let objsClone = [{ a: "a1" }, { b: -9, a: "a2" }];
    // assumptions about input vars (otherwise test is broken)
    expect(objsClone).toStrictEqual(objs);
    expect(objsClone === objs).toBe(false);
    deepMerge(objs);  // check return value elsewhere
    expect(objs).toStrictEqual(objsClone);
  });
  it("Returns last null", () => {
    expect(deepMerge([null, void 0])).toBe(void 0);
    expect(deepMerge([void 0, null, null, void 0, null])).toBe(null);
  });
  /* eslint-disable-next-line jest/valid-describe-callback */
  describe("Merging", test_deepMerge_merge);
}


function test_deepMerge_merge() {
  /* eslint-disable-next-line jest/valid-describe-callback */
  describe("Shallow", test_deepMerge_shallow);
  /* eslint-disable-next-line jest/valid-describe-callback */
  describe("Deep", test_deepMerge_deep);
}

function test_deepMerge_shallow() {
  it("Returns last primitive (just primitives)", () => {
    expect(deepMerge([2, 5.8, -9])).toBe(-9);
    expect(deepMerge(["a_str", "b"])).toBe("b");
    expect(deepMerge([BIGINT_PLUS, -0])).toBe(-0);
    expect(deepMerge([SYM_FOR, 42, "hello", BIGINT_MINUS])).toBe(BIGINT_MINUS);
    expect(deepMerge([-6, "str", SYM_UNIQUE])).toBe(SYM_UNIQUE)
  });
  it("Returns primitive if last (with objects)", () => {
    expect(deepMerge([[7], -8])).toBe(-8);
    expect(deepMerge(["some str", { v: "hello" }, 69.42, new Map, -1])).toBe(-1);
  });
  it("Returns object after primitive", () => {
    expect(deepMerge([-0.49, ["str"]])).toStrictEqual(["str"]);
    expect(deepMerge([45, "rawstr", { obj: true, p: false }])).toStrictEqual({ obj: true, p: false });
  });
  it("Doesn't merge arrays", () => {
    expect(deepMerge([[12, 99, 7], [-7, null]])).toStrictEqual(MERGE_IN_ARRAY ? [-7, 99, 7] : [-7, null]);
  })
  it("Doesn't combine arrays and objects", () => {
    expect(deepMerge([[54, "str"], { "1": 42, v: 9 }])).toStrictEqual({ "1": 42, v: 9 });
    expect(deepMerge([{ "1": 42, v: 9, length: 4 }, [54, "str"]])).toStrictEqual([54, "str"]);
  })
  it("Doesn't merge through primitives", () => {
    expect(deepMerge([{ o: 7 }, "primitive!", { a: 1 }])).toStrictEqual({ a: 1 });
  })
  it("Doesn't merge through arrays", () => {
    expect(deepMerge([{ o: 7, "1": 9, length: 3 }, ["array"], { a: 1, "2": 2 }])).toStrictEqual({ a: 1, "2": 2 });
  })
  it("Doesn't merge with Symbol.dontMerge", () => {
    expect(deepMerge([{ [Symbol.dontMerge]: true }, { a: 9 }, { b: 4 }])).toStrictEqual({ b: 4, [Symbol.dontMerge]: true });
  })
  it("Merges shallow objects", () => {
    expect(deepMerge([{ a: SYM_BUILTIN, b: 4 }, { c: 7, b: "str" }])).toStrictEqual({ a: SYM_BUILTIN, b: "str", c: 7 });
  });
  it("Merges shallow objects with symbol keys", () => {
    expect(deepMerge([
      { [SYM_UNIQUE]: 99, [SYM_FOR]: SYM_FOR, b: 8, j: -2 },
      { [SYM_BUILTIN]: BIGINT_PLUS },
      { [SYM_UNIQUE]: 7, b: 'l' }
    ])).toStrictEqual(
      {[SYM_UNIQUE]: 7, b: 'l', [SYM_BUILTIN]: BIGINT_PLUS, [SYM_FOR]: SYM_FOR, j: -2});
  })
}

function test_deepMerge_deep() {
  it("Preserves deep objects", () => {
    let obj1a = {a: 9, b: {o: 9, a: 8}}
    let obj2 = deepMerge([obj1a, {a: 6, c: 7}]);
    expect(obj2).toStrictEqual({a: 6, b: {o: 9, a: 8}, c: 7});
    expect(obj2.b).toStrictEqual(obj1a.b);
    expect(obj2.b).not.toBe(obj1a.b);
  });
  it("Merges deep objects", () => {
    expect(deepMerge([
      {a: 9, b: {c: 8, q: {v: 7}}},
      {b: {q: {i: 1}, j_: "q"}, $h: -7}
    ])).toStrictEqual({a: 9, b: {c: 8, q: {v: 7, i: 1}, j_: "q"}, $h: -7})
  })
  it("Merges array items", () => {
    expect(deepMerge([
      [7, {a: 9}, 5],
      [6, {b: -1}]
    ])).toStrictEqual(MERGE_IN_ARRAY ? [6, {a: 9, b: -1}, 5] : [6, {b: -1}, 5]);
  })
  it("Merges deep objcts and arrays", () => {
    expect(deepMerge([
      {a: [8], b: 7, c: {d: [2, 64, -3]}},
      {b: -2, c: {e: 8}, f: {o: 9, h: {d: "str"}}},
      {a: [69], f: {}},
      {f: {h: {y: 2, d: null}}}
    ])).toStrictEqual({a: [69], b: -2, c: {d: [2, 64, -3], e: 8}, f: {o: 9, h: {y: 2, d:"str"}}})
  })
  it("Merges classes", () => {
    class A {}
    class B {}
    let a = new A();
    a.value = 9;
    let b = new B();
    let res = deepMerge([a, b]);
    expect(res.constructor).toBe(B);
    let b2 = new B();
    b2.value = 9;
    expect(res.value).toBe(9);
    expect(res).toStrictEqual(b2);
  });
  it("Treats Object as weak type", () => {
    class A {}
    let a = new A();
    a.value = "str";
    let res = deepMerge([a, {b: 7}]);
    expect(res.constructor).toBe(A);
    expect(res).toStrictEqual(Object.assign(new A(), {b: 7, value: "str"}));
  })
}


function _runOnData(obj, func) {
  let { skip, data } = obj;
  if (typeof skip !== "function" && skip) return;
  for (const d of data) {
    if (typeof skip === "function" && skip(d)) continue;
    func(d);
  }
}
