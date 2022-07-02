import { deepMerge, deepCopy } from "../src/utils/deep_merge.js";

describe("deep_merge.js", () => {
  describe.each([
    {copier: (o, cnf) => deepMerge([o], cnf), name: "Single-arg deepMerge"},
    {copier: deepCopy, name: "deepCopy"},
    {copier: (o, cnf) => deepMerge([null, void 0, o, null, void 0], cnf), 
     name: "deepMerge with some nulls"}
  ])("$name", ({copier}) => {
    describe("Shallow primitive handling", () => {
      it.each([
        {name: "boolean", data: [true, false]},
        {name: "numbers", data: [0, -12, 9.7, NaN, Infinity]},
        {name: "bigint", data: [
          0n, 6543n, -8383n, -64547771112849427272721n, 61617349738546589193737113n]},
        {name: "strings", data: ["", "abc", "\x1b[0m\\+)"]},
        {name: "booleans", data: [true, false]},
        {name: "null-ish", data: [null, void 0]},
        {name: "symbols", data: [
          Symbol.unscopables, Symbol('u'), Symbol.for('_test_')]}
      ])("Returns $name directly", ({data}) => {
        for (const d of data) {
          expect(copier(d)).toBe(d);
        }
      })
    })
    describe("Shallow Array handling", () => {
      it.each([
        {name: "empty array", data: []},
        {name: "array with one elmenent", data: ["something"]},
        {name: "array with some elements", data: [1, "str", -9.12, 7n]},
        {name: "array with some nulls", data: [null, 86, false, void 0]}
      ])("$name", ({data}) => {
        let arr = data;
        let arr2 = copier(arr);
        expect(arr === arr2).toBe(false);
        expect(arr2).toStrictEqual(arr);
        expect(arr2.constructor).toBe(Array);
      })
    })
  })
})
