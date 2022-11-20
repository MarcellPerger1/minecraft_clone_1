import './helpers/fetch_local_polyfill.js';
import "./helpers/dummy_dom.js"
import {LoaderContext, isComment} from "../src/config_loader.js";

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
    })
  })
})