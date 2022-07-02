import { deepMerge } from "../src/utils/deep_merge.js";

describe("deepMerge", () => {
  describe("Shallow primitive handling", () => {
    it("Returns numbers directly", () => {
      for (const n of [0, -12, 9.7, NaN, Infinity]) {
        expect(deepMerge([n])).toBe(n);
      }
    })
    it("Returns strings directly", () => {
      for (const s of ["", "abc", "\x1b[0m\\+]"]) {
        expect(deepMerge([s])).toBe(s);
      }
    })
    it("Returns booleans directly", () => {
      for (const b of [true, false]) {
        expect(deepMerge([b])).toBe(b);
      }
    })
    it("Returns null-ish directly", () => {
      for (const n of [null, void 0]){
        expect(deepMerge([n])).toBe(n)
      }
    })
  })
})
