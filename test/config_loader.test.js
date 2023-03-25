import { jest, expect, it, describe } from "@jest/globals";
import { readFile } from "fs/promises";

import "./helpers/fetch_local_polyfill.js";
import {
  isComment,
  LoaderContext,
  parseJsonConfig,
  loadConfigFile,
  stringifyJsonConfig,
} from "../src/config_loader.js";
import { deepMerge } from "../src/utils/deep_merge.js";
import { PlayerConfig } from "../src/config.js";

function makeLoader(configsRoot = null) {
  configsRoot ??= "test/dummy_configs";
  return new LoaderContext(configsRoot);
}

async function _getConfig(rawPath) {
  return parseJsonConfig(await readFile(rawPath));
}

async function _getConfigRel(path) {
  return _getConfig(`./test/dummy_configs/${path}.json`);
}

function _withProto(obj, proto, { allNames = true, symbols = true } = {}) {
  // create *new* object (shallow copy of `obj`) with prototype of `proto`
  let res = Object.create(proto);
  if (allNames) {
    Object.assign(
      res,
      Object.fromEntries(
        Object.getOwnPropertyNames(obj).map((k) => [k, obj[k]])
      )
    );
  } else {
    Object.assign(res, obj);
  }
  if (symbols) {
    Object.assign(
      res,
      Object.fromEntries(
        Object.getOwnPropertySymbols(obj).map((k) => [k, obj[k]])
      )
    );
  }
  return res;
}

function rawStringifyToObj(o, space = 2) {
  return JSON.parse(JSON.stringify(o, void 0, space));
}

function cnfStringifyToObj(o, space = 2) {
  return JSON.parse(stringifyJsonConfig(o, space));
}

describe("config_loader.js", () => {
  describe("isComment (unit test)", () => {
    test_isComment();
  });
  describe("parseJsonConfig", () => {
    describe("Normal JSON handling", () => {
      test_normalJsonHandling();
    });
    describe("Comment handling (integration test)", () => {
      test_commentHandling();
    });
    describe("Infinity handling", () => {
      test_infinityHandling();
    });
    describe("Symbol handling", () => {
      test_symbolHandling();
    });
    describe("Config class handling", () => {
      test_configClassHandling();
    });
  });
  describe("LoaderContext", () => {
    describe("LoaderContext constructor", () => {
      test_ConfigLoader_constructor();
    });
    describe("LoaderContext.getConfigFilename", () => {
      test_getFilename();
    });
    describe("LoaderContext.loadConfigDefaults", () => {
      test_loadDefaults();
    });
    describe("LoaderContext.loadConfigByFilename", () => {
      test_loadByName((lc, path) => lc.loadConfigByFilename(path));
    });
    describe("LoaderContext.loadConfigByName", () => {
      test_loadConfigByName();
    });
    describe("LoaderContext.getConfigBases", () => {
      test_getBases();
    });
    runTestsFor_loadConfig();
  });
  describe("stringifyJsonConfig", () => {
    test_stringify();
  });
});

function test_isComment() {
  describe.each(["$comment", "//", "$#", "#", "/*"])(
    "Handling of '%s' comments",
    (prefix) => {
      it("Recognises it as a comment", () => {
        expect(isComment(prefix)).toBe(true);
        expect(isComment(prefix + " xy")).toBe(true);
        expect(isComment(prefix + "abcd")).toBe(true);
      });
      it("Allows leading whitespace", () => {
        expect(isComment(" " + prefix)).toBe(true);
        expect(isComment("   \t " + prefix)).toBe(true);
      });
      it("Disallows leading non-whitespace chracters", () => {
        expect(isComment("ab" + prefix)).toBe(false);
        expect(isComment("xy " + prefix)).toBe(false);
        expect(isComment("  qr" + prefix)).toBe(false);
      });
    }
  );
  it.each(["a", "%extends", "  something", "  \t \n  ", ""])(
    "Doesn't recognise %o as a comment",
    (s) => {
      expect(isComment(s)).toBe(false);
    }
  );
}

function test_normalJsonHandling() {
  it("Handles string literals", () => {
    expect(parseJsonConfig(`"a string value"`)).toStrictEqual("a string value");
    expect(parseJsonConfig(`"a str \\t\\n\\\\ value"`)).toStrictEqual(
      "a str \t\n\\ value"
    );
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
          data: [
            "a string",
            "a \nother \t str\n\nthis:\\ is a \"backslash'",
            "",
          ],
        },
        {
          name: "mixed array (string and number)",
          data: [-0.0, "string\n\ts\nstr \\not a newline", 5.6, ""],
          str: `[-0.0, ${JSON.stringify(
            "string\n\ts\nstr \\not a newline"
          )}, 5.6, ""]`,
        },
        { name: "array with nulls", data: [2.4, null, "text", null] },
        { name: "empty array", data: [] },
      ])("$name", ({ data, str = null }) => {
        str = str ?? JSON.stringify(data);
        expect(parseJsonConfig(str)).toStrictEqual(data);
      });
    });
    describe("Non-nested object handling", () => {
      it.each([
        { name: "object of number values", data: { d: 4.2, e: -9, f: 0.0 } },
        {
          name: "object of string values",
          data: { r: "abc", d: "", c: "  \n\t\t\\\t\n, not a \\newline" },
        },
        {
          name: "mixed object: (string and number values)",
          data: { q: -0, a: "string\n\ts\nstr \\not a newline", c: 5.6, d: "" },
          str: `{"q": -0, "a":${JSON.stringify(
            "string\n\ts\nstr \\not a newline"
          )}, "c": 5.6, "d": ""}`,
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
          data: {
            a: 2.3,
            b: {},
            c: {
              r: "9.3",
              d: null,
              e: { f: 6 },
            },
            g: { e: 2.2 },
          },
        },
        {
          name: "nested array (no objects)",
          data: [-4, null, ["a\n  \t\\n", 4.2, []], "e", 3.30227, [5.5]],
        },
        {
          name: "object as toplevel",
          data: {
            a: 54,
            d: null,
            c: [
              -0.2,
              "qw",
              {
                a: "\\\t",
                abc: [],
              },
            ],
            e: { w: {} },
          },
        },
        {
          name: "array as toplevel",
          data: [
            "54",
            null,
            [],
            { q: null, v: 4.23, h: { x: 0 }, a: [-2.3] },
            ["3.4", -1.02],
            {},
          ],
        },
      ])("$name", ({ data, str = null }) => {
        str = str ?? JSON.stringify(data);
        expect(parseJsonConfig(str)).toStrictEqual(data);
      });
    });
  });
}

function test_commentHandling() {
  describe.each(["$comment", "//", "$#", "#", "/*"])(
    "Handling of '%s' comments",
    (prefix) => {
      it.each([
        {
          name: "object inside array",
          getData() {
            return [3, { x: -2.3, y: "\ta\\n<-same line" }, null, []];
          },
          setAttr(data, k) {
            data[1][k] = { d: 5.6, e: "aa", f: [{}] };
          },
        },
        {
          name: "single-key object",
          getData() {
            return {};
          },
          setAttr(data, k) {
            data[k] = -3.4;
          },
        },
        {
          name: "normal object",
          getData() {
            return { attr: { y: [""] }, normal: [{ t: 0 }] };
          },
          setAttr(data, k) {
            data[k] = { q: 8, i: [2, "a"] };
          },
        },
        {
          name: "big nested object",
          getData() {
            return { a: null, b: [{ y: "\\t=\t", d: {} }] };
          },
          setAttr(data, k) {
            data.b[0][k] = [[[], null, {}], { v: "2" }];
          },
        },
      ])("$name", ({ getData, setAttr }) => {
        let data = getData();
        setAttr(data, `${prefix}xyz`);
        expect(parseJsonConfig(JSON.stringify(data))).toStrictEqual(getData());
      });
    }
  );
}

function test_infinityHandling() {
  it("Handles infinity as the root", () => {
    expect(parseJsonConfig(`"Infinity"`)).toBe(Infinity);
    expect(parseJsonConfig(`"-Infinity"`)).toBe(-Infinity);
  });
  it("Handles infinity in array", () => {
    expect(parseJsonConfig(`[3.2, "Infinity", "str", null]`)).toStrictEqual([
      3.2,
      Infinity,
      "str",
      null,
    ]);
    expect(parseJsonConfig(`[3.2, "-Infinity", "str", null]`)).toStrictEqual([
      3.2,
      -Infinity,
      "str",
      null,
    ]);
  });
  it("Handles infinity in object", () => {
    expect(
      parseJsonConfig(`{"a": 3.2, "f":"Infinity", "e":"str", "q":null}`)
    ).toStrictEqual({ a: 3.2, f: Infinity, e: "str", q: null });
    expect(
      parseJsonConfig(`{"a": 3.2, "f":"-Infinity", "e":"str", "q":null}`)
    ).toStrictEqual({ a: 3.2, f: -Infinity, e: "str", q: null });
  });
  it("Handles infinity nestedly", () => {
    let s =
      `{"a": 3.2, "f":"-Infinity", "e":"str", ` +
      `"q": [null, "Infinity", {"y": "-Infinity", "z": {}}]}`;
    expect(parseJsonConfig(s)).toStrictEqual({
      a: 3.2,
      f: -Infinity,
      e: "str",
      q: [null, Infinity, { y: -Infinity, z: {} }],
    });
  });
  it("Ignores infinity as keys", () => {
    expect(parseJsonConfig(`{"Infinity": [2.3, ""]}`)).toStrictEqual({
      Infinity: [2.3, ""],
    });
    expect(parseJsonConfig(`{"-Infinity": {"k": null}}`)).toStrictEqual({
      "-Infinity": { k: null },
    });
  });
}

function test_symbolHandling() {
  it("Handles builtin symbols", () => {
    expect(parseJsonConfig(`{"@@unscopables": ["abc"]}`)).toStrictEqual({
      [Symbol.unscopables]: ["abc"],
    });
    expect(parseJsonConfig(`[{"@@isConcatSpreadable": false}]`)).toStrictEqual([
      { [Symbol.isConcatSpreadable]: false },
    ]);
  });
  it("Handles global symbols", () => {
    let s = Symbol.for("__not_builtin");
    expect(parseJsonConfig(`{"e": {"@@__not_builtin": 1}}`)).toStrictEqual({
      e: { [s]: 1 },
    });
  });
  it("Prefers builtin over global symbols", () => {
    let globalSymbol = Symbol.for("_symbol_name"); // <- 'global' symbol
    Symbol._symbol_name = Symbol.for("_builtin_symbol"); // <- 'builtin' symbol
    try {
      let v = parseJsonConfig(`{"e": {"@@_symbol_name": 1}}`);
      expect(v).toStrictEqual({ e: { [Symbol._symbol_name]: 1 } });
      expect(v).not.toStrictEqual({ e: { [globalSymbol]: 1 } });
    } finally {
      delete Symbol._symbol_name;
    }
  });
  it("Creates symbol in global registry if required", () => {
    expect(parseJsonConfig(`{"@@_not_a_symbol": 7}`)).toStrictEqual({
      [Symbol.for("_not_a_symbol")]: 7,
    });
  });
  it("Ignores symbol values", () => {
    expect(parseJsonConfig(`["@@a_symbol"]`)).toStrictEqual(["@@a_symbol"]);
    expect(parseJsonConfig(`{"@@unscopables": "@@a_symbol"}`)).toStrictEqual({
      [Symbol.unscopables]: "@@a_symbol",
    });
  });
}

const LONG_STR =
  "VeryVeryExtremelyIncredibly" + "UnbeleivablyIncomprehensiblyLongString";

function test_configClassHandling() {
  // the no $class branch is checked thoroughly in other tests
  it("Throws error if class isn't a config class", () => {
    expect(() =>
      parseJsonConfig(JSON.stringify({ $class: "Invalid" }))
    ).toThrow(/not a config class/i);
  });
  it("Throws error if class name is too long", () => {
    expect(() =>
      parseJsonConfig(JSON.stringify({ $class: LONG_STR + "Config" }))
    ).toThrow(/config classes should have reasonably short names/i);
  });
  it("Throws an error if class does not exist", () => {
    expect(() =>
      parseJsonConfig(JSON.stringify({ $class: "NotA_Config" }))
    ).toThrow(/cant find config class/i);
  });
  it("Uses config class if it exists", () => {
    expect(
      parseJsonConfig(JSON.stringify({ $class: "PlayerConfig" }))
    ).toStrictEqual(new PlayerConfig({ $class: "PlayerConfig" }));
  });
}

function test_ConfigLoader_constructor() {
  it("Uses the passed configsRoot", () => {
    expect(new LoaderContext("some/path/to/a/file")).toHaveProperty(
      "configsRoot",
      "some/path/to/a/file"
    );
  });
  it("Defaults to the configs directory", () => {
    expect(new LoaderContext()).toHaveProperty("configsRoot", "configs");
  });
}

function test_getFilename() {
  it("Raises error if name contains '..'", () => {
    for (const name of ["..", "a/../b", "/a/../f", "./../r.j"]) {
      expect(() => {
        new LoaderContext().getConfigFilename(name);
      }).toThrow();
      for (const root of ["/root/path", "./rel/path/", "1", "p/", "a/b"]) {
        expect(() => {
          new LoaderContext(root).getConfigFilename(name);
        }).toThrow("..");
      }
    }
  });
  it("Removes leading '.' and '/'", () => {
    expect(new LoaderContext("root/path").getConfigFilename("./r.json")).toBe(
      "./root/path/r.json"
    );
    expect(new LoaderContext("root/path").getConfigFilename("/r.json")).toBe(
      "./root/path/r.json"
    );
    expect(new LoaderContext("root/path").getConfigFilename("/./r.json")).toBe(
      "./root/path/r.json"
    );
  });
  it("Adds leading `./` if needed", () => {
    const lc = new LoaderContext("config/path");
    expect(lc.getConfigFilename("xyx.json")).toBe("./config/path/xyx.json");
    expect(lc.getConfigFilename("d/z.json")).toBe("./config/path/d/z.json");
  });
  it("Remove duplicated `/`", () => {
    const lc = new LoaderContext("config/path");
    expect(lc.getConfigFilename("h//r.json")).toBe("./config/path/h/r.json");
    expect(lc.getConfigFilename(".///h////r///u.json")).toBe(
      "./config/path/h/r/u.json"
    );
  });
  it("Adds `.json` ending if not present", () => {
    const lc = new LoaderContext("config/path");
    expect(lc.getConfigFilename("./x/y/z.json")).toBe(
      "./config/path/x/y/z.json"
    );
    expect(lc.getConfigFilename("./x/y/z")).toBe("./config/path/x/y/z.json");
    expect(lc.getConfigFilename("y")).toBe("./config/path/y.json");
  });
  it("Doesn't add `configsRoot` to path if already present", () => {
    const lc = new LoaderContext("config/path");
    expect(lc.getConfigFilename("config/path/j.json")).toBe(
      "./config/path/j.json"
    );
    expect(lc.getConfigFilename("./config/path/nested/k")).toBe(
      "./config/path/nested/k.json"
    );
  });
  it("Leaves '.' in middle of path intact", () => {
    const lc = new LoaderContext("config/path");
    expect(lc.getConfigFilename(".///h////.r////u.json")).toBe(
      "./config/path/h/.r/u.json"
    );
    expect(lc.getConfigFilename(".///h///./r///u.json")).toBe(
      "./config/path/h/./r/u.json"
    );
    expect(lc.getConfigFilename(".///h///././/./.r///u.json")).toBe(
      "./config/path/h/./././.r/u.json"
    );
  });
  it("Handles everythin together", () => {
    const lc = new LoaderContext("config/path");
    expect(lc.getConfigFilename("///config///path//0-num.e")).toBe(
      "./config/path/0-num.e.json"
    );
  });
}

function test_loadDefaults() {
  it("Loads from default.json file", async () => {
    let lc = new LoaderContext("test/dummy_configs");
    let result = await lc.loadConfigDefaults();
    expect(result).toStrictEqual(
      parseJsonConfig(await readFile("./test/dummy_configs/default.json"))
    );
  });
  it("Loads config file without inheritance", async () => {
    let lc = new LoaderContext("test/dummy_configs");
    let loaderFn = (lc.loadConfigFile = jest.fn(() => ({})));
    await lc.loadConfigDefaults();
    expect(loaderFn).toBeCalledTimes(1);
    expect(loaderFn).toBeCalledWith(
      "./test/dummy_configs/default.json",
      false,
      void 0
    );
  });
  it("Returns result from loadConfigFile", async () => {
    let ref = { key: "value" };
    let lc = new LoaderContext("test/dummy_configs");
    lc.loadConfigFile = () => ref;
    expect(await lc.loadConfigDefaults()).toBe(ref);
  });
}

function test_loadByName(
  /** @type {(lc: LoaderContext, path: string) => Promise<object>} */ loadFn
) {
  it("Calls loadConfigFile", async () => {
    let lc = new LoaderContext("test/dummy_configs");
    let ref = {};
    lc.loadConfigFile = jest.fn(async () => ref);
    let result = await loadFn(lc, "something");
    expect(result).toBe(ref);
    expect(lc.loadConfigFile).toBeCalledTimes(1);
    expect(lc.loadConfigFile).toBeCalledWith(
      "./test/dummy_configs/something.json",
      void 0,
      void 0
    );
  });
  it("Handles nested directories", async () => {
    let lc = new LoaderContext("test/dummy_configs");
    let ref = {};
    lc.loadConfigFile = jest.fn(async () => ref);
    let result = await loadFn(lc, "nested_dir/inner");
    expect(result).toBe(ref);
    expect(lc.loadConfigFile).toBeCalledTimes(1);
    expect(lc.loadConfigFile).toBeCalledWith(
      "./test/dummy_configs/nested_dir/inner.json",
      void 0,
      void 0
    );
  });
}

function test_loadConfigByName() {
  test_loadByName((lc, path) => {
    return lc.loadConfigByName(path);
  });
  it("Disables inheritance for default", async () => {
    let lc = new LoaderContext("test/dummy_configs");
    let ref = {};
    lc.loadConfigFile = jest.fn(async () => ref);
    let result = await lc.loadConfigByName("default");
    expect(result).toBe(ref);
    expect(lc.loadConfigFile).toBeCalledTimes(1);
    expect(lc.loadConfigFile).toBeCalledWith(
      "./test/dummy_configs/default.json",
      false,
      void 0
    );
  });
}

function test_getBases() {
  it("Defaults to 'default'", () => {
    let lc = makeLoader("test/dummy_configs");
    let result = lc.getConfigBases({ attr: 8 });
    expect(result).toStrictEqual(["default"]);
  });
  it.each([
    { name: "Treats null as default", $extends: null, expected: ["default"] },
    {
      name: "Treats undefined as default",
      $extends: void 0,
      expected: ["default"],
    },
    { name: "Allows empty list", $extends: [], expected: [] },
    {
      name: "Treats list with just comments as non-empty",
      $extends: ["#comment", "//a comment"],
      expected: ["default"],
    },
    {
      name: "Handles one-item list",
      $extends: ["something"],
      expected: ["something"],
    },
    {
      name: "Handles multi-item list",
      $extends: ["something", "nested_dir/inner"],
      expected: ["something", "nested_dir/inner"],
    },
    {
      name: "Handles comment string as base",
      $extends: "#a comment",
      expected: ["default"],
    },
    {
      name: "Handles comments in multiple inheritance",
      $extends: ["#", "something", "//a", "default", "$comment:a"],
      expected: ["something", "default"],
    },
  ])("$name", ({ $extends, expected }) => {
    let lc = makeLoader();
    let result = lc.getConfigBases({ $extends });
    expect(result).toStrictEqual(expected);
  });
}

function runTestsFor_loadConfig() {
  describe.each([
    {
      name: "LoaderContext.loadConfigFile",
      fn(p, i, configsRoot) {
        return new LoaderContext(configsRoot).loadConfigFile(p, i);
      },
    },
    { name: "root loadConfigFile", fn: loadConfigFile },
  ])("$name", ({ fn }) => {
    test_loadConfig_common(fn);
  });
  describe("LoaderContext.loadConfigFile", () => {
    test_loadConfig_class();
  });
  describe("root loadConfigFile", () => {
    test_loadConfig_root();
  });
}

function test_loadConfig_common(fn) {
  it("Processes config path berfore usage", async () => {
    let result = await fn("default", false, "test/dummy_configs");
    let expected = parseJsonConfig(
      await readFile("./test/dummy_configs/default.json")
    );
    expect(result).toStrictEqual(expected);
  });
  it("Defaults to inheritance=true", async () => {
    let result = await fn("something", void 0, "test/dummy_configs");
    expect(result).toStrictEqual(
      await fn("something", true, "test/dummy_configs")
    );
  });
  it("Defaults to configsRoot='configs'", async () => {
    let result = await fn("_for_test", false);
    expect(result).toStrictEqual(await _getConfig("./configs/_for_test.json"));
  });
  it("Uses single inheritance from default", async () => {
    let expected = deepMerge(
      await Promise.all([_getConfigRel("default"), _getConfigRel("something")])
    );
    let result = await fn("something", true, "test/dummy_configs");
    expect(expected).toStrictEqual(result);
  });
  it("Handles single inheritance", async () => {
    let expected = deepMerge(
      await Promise.all([
        _getConfigRel("default"),
        _getConfigRel("something"),
        _getConfigRel("nested_dir/inner"),
      ])
    );
    let result = await fn("nested_dir/inner.json", true, "test/dummy_configs");
    expect(expected).toStrictEqual(result);
  });
  it("Handles multiple inheritance", async () => {
    let expected = deepMerge(
      await Promise.all([
        _getConfigRel("default"),
        _getConfigRel("something"),
        _getConfigRel("base2"),
        _getConfigRel("multi_inherit"),
      ])
    );
    let result = await fn("multi_inherit", true, "test/dummy_configs");
    expect(expected).toStrictEqual(result);
  });
  it("Throws error for directly recursive inheritance", async () => {
    await expect(
      fn("recursive_direct", true, "test/dummy_configs")
    ).rejects.toThrow();
  }, 500);
  it("Throws error for indirecly recursive configs", async () => {
    await expect(
      fn("indirect_recursive/config1", true, "test/dummy_configs")
    ).rejects.toThrow();
  }, 500);
  it("Allows non-recusive multi inheritance", async () => {
    let expected = deepMerge(
      await Promise.all([
        _getConfigRel("default"),
        _getConfigRel("base2"),
        _getConfigRel("multi_inherit"),
        _getConfigRel("something"),
        _getConfigRel("multi_inherit_2"),
      ])
    );
    let result = await fn("multi_inherit_2", true, "test/dummy_configs");
    expect(expected).toStrictEqual(result);
  });
}

function test_loadConfig_class() {
  it("Doesn't use inheritance if inheritance is false (class)", async () => {
    let lc = makeLoader();
    lc.handleConfigInheritance = jest.fn((cnf) => cnf);
    let result = await lc.loadConfigFile("something", false);
    let expected = parseJsonConfig(
      await readFile("./test/dummy_configs/something.json")
    );
    expect(result).toStrictEqual(expected);
    expect(lc.handleConfigInheritance).not.toHaveBeenCalled();
  });
}

function test_loadConfig_root() {
  it("Doesn't use inheritance if inheritance is false (root)", async () => {
    let result = await loadConfigFile("something", false, "test/dummy_configs");
    let expected = parseJsonConfig(
      await readFile("./test/dummy_configs/something.json")
    );
    expect(result).toStrictEqual(expected);
  });
  it("Calls LoaderContext.loadConfigFile", async () => {
    let proto = LoaderContext.prototype;
    let orig = proto.loadConfigFile;
    let ref = {};
    let thisValue = null;
    function impl() {
      thisValue = this;
      return ref;
    }
    try {
      let mockFn = (proto.loadConfigFile = jest.fn(impl));
      expect(await loadConfigFile("xyz", true, "root")).toBe(ref);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith("xyz", true);
      expect(thisValue).toStrictEqual(
        _withProto({ configsRoot: "root" }, proto)
      );
    } finally {
      proto.loadConfigFile = orig;
    }
  });
}

function test_stringify() {
  it("Stringifies normal objects (no spaces)", () => {
    let o = {
      arr: [23, "a str", "escapes: \n\\\\\t", {}],
      n: -22,
      n1: 0,
      x: [[], {}],
    };
    expect(stringifyJsonConfig(o, 0)).toStrictEqual(JSON.stringify(o, 0));
  });
  it("Stringifies normal objects (space = 2)", () => {
    let o = {
      arr: [23, "a str", "escapes: \n\\\\\t", {}],
      n: -22,
      n1: 0,
      x: [[], {}],
    };
    expect(stringifyJsonConfig(o, 2)).toStrictEqual(
      JSON.stringify(o, void 0, 2)
    );
  });
  it("Has default spaces at 0", () => {
    let o = {
      arr: [23, "a str", "escapes: \n\\\\\t", {}],
      n: -22,
      n1: 0,
      x: [[], {}],
    };
    expect(stringifyJsonConfig(o)).toStrictEqual(JSON.stringify(o, void 0, 0));
  });
  it("Stringifies symbols in root object (from Symbol.for)", () => {
    let s = Symbol.for("__forTest");
    let o = { [s]: 123.4, other: [{}, "s"] };
    expect(cnfStringifyToObj(o, 2)).toStrictEqual(
      rawStringifyToObj({
        "@@__forTest": 123.4,
        other: [{}, "s"],
      })
    );
  });
  it("Stringifies builtin symbol in root object", () => {
    let s = Symbol.unscopables;
    let o = { [s]: 123.4, other: [{}, "s"] };
    expect(cnfStringifyToObj(o)).toStrictEqual(
      rawStringifyToObj({
        "@@unscopables": 123.4,
        other: [{}, "s"],
      })
    );
  });
  it("Stringifies all symbols", () => {
    let o = [
      0,
      { [Symbol.toStringTag]: "builtin", v: { [Symbol.for("symbol_k")]: [] } },
    ];
    expect(cnfStringifyToObj(o)).toStrictEqual(
      rawStringifyToObj([
        0,
        {
          "@@toStringTag": "builtin",
          v: { "@@symbol_k": [] },
        },
      ])
    );
  });
  it("Ignores symbols in values", () => {
    let o = { n: 8, smb: Symbol.toStringTag };
    expect(cnfStringifyToObj(o)).toStrictEqual(
      rawStringifyToObj({
        n: 8,
      })
    );
  });
  it("Handles +Infinity", () => {
    let o = [6.5, "e", { v: Infinity }];
    expect(cnfStringifyToObj(o)).toStrictEqual([6.5, "e", { v: "Infinity" }]);
  });
  it("Handles -Infinity", () => {
    let o = { x: 7, y: -Infinity, z: [] };
    expect(cnfStringifyToObj(o)).toStrictEqual({ x: 7, y: "-Infinity", z: [] });
  });
  it("Handles classes", () => {
    class MyClass {}
    let inner = new MyClass();
    Object.assign(inner, { x: -8.7, y: { u: [2, 0], x: "" } });
    let o = [inner, "string", null, 8];
    expect(cnfStringifyToObj(o)).toStrictEqual([
      { x: -8.7, y: { u: [2, 0], x: "" }, $class: "MyClass" },
      "string",
      null,
      8,
    ]);
  });
  describe.each(["$comment", "//", "$#", "#", "/*"])(
    "Handling of '%s' comments",
    (prefix) => {
      it("Throws error if in key", () => {
        expect(() => {
          stringifyJsonConfig({ [prefix + "extra-text"]: 77.7 });
        }).toThrow("comment");
      });
      it("Allows it in value", () => {
        expect(cnfStringifyToObj([0, prefix + "extra-text", {}])).toStrictEqual(
          [0, prefix + "extra-text", {}]
        );
      });
    }
  );
}
