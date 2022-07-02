import {deepMerge} from "../src/utils/deep_merge.js";
 
describe("deepMerge", () => {
  it("Returns primitives directly", () => {
    expect(deepMerge([1])).toBe(1);
    expect(deepMerge(["abc"])).toBe("abc");
  })
})