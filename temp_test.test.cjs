const x = require('./temp_cjs.cjs');

describe("A", () => {
  it("B", () => {
    expect(x.a(1)).toBe(2);
  })
})