import './helpers/fetch_local_polyfill.js';
import "./helpers/dummy_dom.js"
import {LoaderContext, isComment, parseJsonConfig} from "../src/config_loader.js";

describe("config_loader.js", () => {
  describe("isComment" , () => {
    describe.each([
      "$comment",
      "//",
      "$#",
      "#",
      "/*"
    ])("Handling of '%s' comments" , (prefix) => {
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
  });
  describe("parseJsonConfig", () => {
    describe("Normal JSON handling", () => {
      it("Handles string literals", () => {
        expect(parseJsonConfig(`"a string value"`))
          .toStrictEqual("a string value");
        expect(parseJsonConfig(`"a str \\t\\n\\\\ value"`))
          .toStrictEqual("a str \t\n\\ value");
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
      });
      describe("object/list handling", () => {
        describe("Non-nested array handling", () => {
          it.each([
            {name: "array of numbers", data: [0, 1.76, -0.1, -76, 0.0]},
            {name: "array of strings",
             data: ["a string", "a \nother \t str\n\nthis:\\ is a \"backslash'", '']},
            {name: "mixed array (string and number)", 
             data: [-0, "string\n\ts\nstr \\not a newline", 5.6, ""],
             str: `[-0, ${
               JSON.stringify("string\n\ts\nstr \\not a newline")
             }, 5.6, ""]`},
            ])("$name", ({data, str=null}) => {
              str = str ?? JSON.stringify(data);
              expect(parseJsonConfig(str)).toStrictEqual(data);
            })
        })
      })
    });
  })
})
