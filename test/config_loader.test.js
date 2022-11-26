import './helpers/fetch_local_polyfill.js';
import "./helpers/dummy_dom.js"
import { isComment, parseJsonConfig } from "../src/config_loader.js";

describe("config_loader.js", () => {
  describe("isComment (unit test)", () => {test_isComment()});
  describe("parseJsonConfig", () => {
    describe("Normal JSON handling", () => {test_normalJsonHandling()});
    describe("Comment handling (integration test)", () => {test_commentHandling()});
    describe("Infinity handling", () => {test_infinityHandling()});
    describe("Symbol handling", () => {test_symbolHandling()});
  });
})


function test_isComment() {
  describe.each([
    "$comment",
    "//",
    "$#",
    "#",
    "/*"
  ])("Handling of '%s' comments", (prefix) => {
    it("Recognises it as a comment", () => {
      expect(isComment(prefix)).toBe(true);
      expect(isComment(prefix + " xy")).toBe(true);
      expect(isComment(prefix + "abcd")).toBe(true);
    })
    it("Allows leading whitespace", () => {
      expect(isComment(" " + prefix)).toBe(true);
      expect(isComment("   \t " + prefix)).toBe(true);
    })
    it("Disallows leading non-whitespace chracters", () => {
      expect(isComment("ab" + prefix)).toBe(false);
      expect(isComment("xy " + prefix)).toBe(false);
      expect(isComment("  qr" + prefix)).toBe(false);
    })
  });
  it.each([
    "a",
    "%extends",
    "  something",
    "  \t \n  ",
    ""
  ])("Doesn't recognise %o as a comment", (s) => {
    expect(isComment(s)).toBe(false);
  });
}


function test_normalJsonHandling() {
  it("Handles string literals", () => {
    expect(parseJsonConfig(`"a string value"`))
      .toStrictEqual("a string value");
    expect(parseJsonConfig(`"a str \\t\\n\\\\ value"`))
      .toStrictEqual("a str \t\n\\ value");
    expect(parseJsonConfig(`""`)).toStrictEqual("");
  });
  it("Handles whole numbers", () => {
    expect(parseJsonConfig("123")).toBe(123);
    expect(parseJsonConfig("-97")).toBe(-97);
    expect(parseJsonConfig("0")).toBe(0);
    expect(parseJsonConfig("-0")).toBe(-0);
  });
  it("Handles floating point numbers", () => {
    expect(parseJsonConfig("769.02")).toBe(769.02);
    expect(parseJsonConfig("-902.4")).toBe(-902.4);
    expect(parseJsonConfig("-3.2e-40")).toBe(-3.2e-40);
    expect(parseJsonConfig("7.6e80")).toBe(7.6e80);
  });
  it("Handles null", () => {
    expect(parseJsonConfig("null")).toBe(null);
  });
  it("Handles booleans", () => {
    expect(parseJsonConfig("true")).toBe(true);
    expect(parseJsonConfig("false")).toBe(false);
  });
  describe("object/list handling", () => {
    describe("Non-nested array handling", () => {
      it.each([
        { name: "array of numbers", data: [0, 1.76, -0.1, -76, 0.0] },
        {
          name: "array of strings",
          data: ["a string", "a \nother \t str\n\nthis:\\ is a \"backslash'", '']
        },
        {
          name: "mixed array (string and number)",
          data: [-0.0, "string\n\ts\nstr \\not a newline", 5.6, ""],
          str: `[-0.0, ${JSON.stringify("string\n\ts\nstr \\not a newline")
            }, 5.6, ""]`
        },
        { name: "array with nulls", data: [2.4, null, "text", null] },
        { name: "empty array", data: [] },
      ])("$name", ({ data, str = null }) => {
        str = str ?? JSON.stringify(data);
        expect(parseJsonConfig(str)).toStrictEqual(data);
      })
    });
    describe("Non-nested object handling", () => {
      it.each([
        { name: "object of number values", data: { d: 4.2, e: -9, f: 0.0 } },
        {
          name: "object of string values",
          data: { r: "abc", d: "", c: "  \n\t\t\\\t\n, not a \\newline" }
        },
        {
          name: "mixed object: (string and number values)",
          data: { q: -0, a: "string\n\ts\nstr \\not a newline", c: 5.6, d: "" },
          str: `{"q": -0, "a":${JSON.stringify("string\n\ts\nstr \\not a newline")
            }, "c": 5.6, "d": ""}`
        },
        { name: "object with nulls", data: { a: 4.5, b: null, c: "str" } },
        { name: "empty object", data: {} },
      ])("$name", ({ data, str = null }) => {
        str = str ?? JSON.stringify(data);
        expect(parseJsonConfig(str)).toStrictEqual(data);
      });
    });
    describe("Nested object/array handling", () => {
      it.each([
        {
          name: "nested object (no arrays)",
          data: { a: 2.3, b: {}, c: { r: "9.3", d: null, e: { f: 6 } }, g: { e: 2.2 } }
        },
        {
          name: "nested array (no objects)",
          data: [-4, null, ["a\n  \t\\n", 4.2, []], "e", 3.30227, [5.5]]
        },
        {
          name: "object as toplevel",
          data: { a: 54, d: null, c: [-0.2, "qw", { a: "\\\t", abc: [] }], e: { w: {} } }
        },
        {
          name: "array as toplevel",
          data: ["54", null, [],
            { q: null, v: 4.23, h: { x: 0 }, a: [-2.3] }, ["3.4", -1.02], {}]
        }
      ])("$name", ({ data, str = null }) => {
        str = str ?? JSON.stringify(data);
        expect(parseJsonConfig(str)).toStrictEqual(data);
      });
    })
  })
}

function test_commentHandling() {
  describe.each([
    "$comment",
    "//",
    "$#",
    "#",
    "/*"
  ])("Handling of '%s' comments", (prefix) => {
    it.each([
      {
        name: "object inside array", 
        getData() {
          return [3, {x: -2.3, y: "\ta\\n<-same line"}, null, []]
        },
        setAttr(data, k) {
          data[1][k] = {d: 5.6, e: "aa", f: [{}]};
        }
      },
      {
        name: "single-key object",
        getData() { return {}; },
        setAttr(data, k) { data[k] = -3.4}
      },
      {
        name: "normal object",
        getData() {
          return {attr: {y: [""]}, normal: [{t: 0}]};
        },
        setAttr(data, k) {
          data[k] = {q: 8, i: [2, "a"]};
        }
      },
      {
        name: "big nested object",
        getData() {
          return {a: null, b: [{y: "\\t=\t", d: {}}]}
        },
        setAttr(data, k) {
          data.b[0][k] = [[[], null, {}], {v: "2"}]
        }
      }
    ])("$name", ({getData, setAttr}) => {
      let data = getData();
      setAttr(data, `${prefix}xyz`);
      expect(parseJsonConfig(JSON.stringify(data))).toStrictEqual(getData());
    })
  });
}

function test_infinityHandling() {
  it("Handles infinity as the root",  () => {
    expect(parseJsonConfig(`"Infinity"`)).toBe(Infinity);
    expect(parseJsonConfig(`"-Infinity"`)).toBe(-Infinity);
  });
  it("Handles infinity in array", () => {
    expect(parseJsonConfig(`[3.2, "Infinity", "str", null]`))
      .toStrictEqual([3.2, Infinity, "str", null]);
    expect(parseJsonConfig(`[3.2, "-Infinity", "str", null]`))
      .toStrictEqual([3.2, -Infinity, "str", null]);
  })
  it("Handles infinity in object", () => {
    expect(parseJsonConfig(`{"a": 3.2, "f":"Infinity", "e":"str", "q":null}`))
      .toStrictEqual({a: 3.2, f:Infinity, e:"str", q:null});
    expect(parseJsonConfig(`{"a": 3.2, "f":"-Infinity", "e":"str", "q":null}`))
      .toStrictEqual({a: 3.2, f:-Infinity, e:"str", q:null});
  })
  it("Handles infinity nestedly", () => {
    let s = `{"a": 3.2, "f":"-Infinity", "e":"str", ` +
      `"q": [null, "Infinity", {"y": "-Infinity", "z": {}}]}`
    expect(parseJsonConfig(s)).toStrictEqual(
      {a: 3.2, f:-Infinity, e:"str", q: [
        null, Infinity, {y: -Infinity, z: {}}]});
  });
}

function test_symbolHandling() {
  it("Handles builtin symbols", () => {
    expect(parseJsonConfig(`{"@@unscopables": ["abc"]}`))
      .toStrictEqual({[Symbol.unscopables]: ["abc"]});
    expect(parseJsonConfig(`[{"@@isConcatSpreadable": false}]`))
      .toStrictEqual([{[Symbol.isConcatSpreadable]: false}]);
  });
  it("Handles global symbols", () => {
    let s = Symbol.for("__not_builtin");
    expect(parseJsonConfig(`{"e": {"@@__not_builtin": 1}}`))
      .toStrictEqual({e: {[s]: 1}});
  });
  it("Prefers builtin over global symbols", () => {
    Symbol.for("symbol_name");  // <- 'global' symbol
    Symbol._symbol_name = Symbol.for('_builtin_symbol');  // <- 'builtin' symbol
    try {
      expect(parseJsonConfig(`{"e": {"@@_symbol_name": 1}}`))
        .toStrictEqual({e: {[Symbol._symbol_name]: 1}});
    } finally {
      delete Symbol._symbol_name;
    }
  });
  it("Creates symbol in global registry if required", () => {
    expect(parseJsonConfig(`{"@@_not_a_symbol": 7}`))
      .toStrictEqual({[Symbol.for('_not_a_symbol')]: 7});
  });
  it("Ignores symbol values", () => {
    expect(parseJsonConfig(`["@@a_symbol"]`)).toStrictEqual(["@@a_symbol"]);
    expect(parseJsonConfig(`{"@@unscopables": "@@a_symbol"}`))
      .toStrictEqual({[Symbol.unscopables]: "@@a_symbol"});
  })
}
