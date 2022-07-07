import { deepMerge, deepCopy } from "../src/utils/deep_merge.js";

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
  describe("deepMerge mutli-arg", () => {
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
  })
})

function test_deepCopy({ copier, id }) {
  describe("Shallow primitive handling", () => {
    it.each([
      { name: "boolean", data: [true, false] },
      { name: "numbers", data: [0, -12, 9.7, NaN, Infinity] },
      {
        name: "bigint", data: [
          0n, 6543n, -8383n, -64547771112849427272721n, 61617349738546589193737113n
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
          Symbol.unscopables, Symbol('u'), Symbol.for('_test_')
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
          1, "str", -9.12, 7n, Symbol('e'), true
        ]
      },
      {
        name: "array with some nulls", data: [
          null, Symbol('q'), 86, false, void 0, "v"
        ]
      },
      /* eslint-disable no-sparse-arrays */
      { name: "empty sparse array", data: new Array(1000) },
      { name: "sparse array at end", data: [9, "e", Symbol('q'), , , ,] },
      { name: "sparse array at start", data: [, , , 5, Symbol('p'), -7n, false, null] },
      { name: "very sparse array", data: [, , void 0, -2n, , , null, , ,] }
      /* eslint-enable no-sparse-arrays */
    ])("$name", ({ data }) => {
      let arr = data;
      let arr2 = copier(arr);
      expect(arr === arr2).toBe(false);
      expect(arr2).toStrictEqual(arr);
      expect(arr2.constructor).toBe(Array);
      for (let i = 0; i < data.length; i++) {
        expect(i in arr).toEqual(i in arr2);
      }
    });
  });
  describe("Shallow Object handling", () => {
    it.each([
      { name: "empty object", data: {} },
      { name: "object with single attr", data: { y: Symbol('o') } },
      { name: "object with string keys", data: { e: 9, HellowWorld: -7373n, u: "r" } },
      { name: "object with Some nulls", data: { o: null, v: false, sm: void 0 } },
      { name: "object with Symbol keys", data: { [Symbol.isConcatSpreadable]: true, [Symbol('x')]: 9 } },
      { name: "object with mixed keys", data: { [Symbol('M')]: Symbol('O'), aB: 9 } },
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
      { name: "object containing array", data: { a: [-8n, "str", 67.1], b: Symbol('f'), a2: [89, undefined] } },
      { name: "object containing object", data: { o: { p: 9, q: "str" }, o2: { o: { e: 2.7, pi: 3.14, t: "math" }, v: "9f" } } },
      { name: "array containing array", data: [[8.3, -9n, "s", [2]], false, [], "3"] },
      { name: "array continaing object", data: [{ u: 9, p: "st" }, "f", { [Symbol.split]: NaN }] },
      { name: "mixed object", data: [{ e: [{ w: "o", h: -3n }, 1.901], [Symbol('f')]: true }, [], null, 0, [{ r0: "ef", h: void 0 }, Symbol('f')]] }
    ]
    it.each(testData)("Returns equal object: $name", ({ data }) => {
      let obj2 = copier(data);
      expect(obj2 === data).toBe(false);
      expect(obj2).toStrictEqual(data);
    })
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
