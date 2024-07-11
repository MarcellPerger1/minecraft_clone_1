import timersPromises from "node:timers/promises";
import fs from "node:fs";

import { describe, it, beforeAll, expect } from "@jest/globals";
import ppt, { TimeoutError } from "puppeteer";
import jestImageSnapshot from "jest-image-snapshot";
import covToIstanbul from "puppeteer-to-istanbul";
// for types:
import "./_image_snapshot_types/index.js";

expect.extend({
  toMatchImageSnapshot: jestImageSnapshot.configureToMatchImageSnapshot({
    comparisonMethod: "ssim",
    failureThresholdType: "percent",
    failureThreshold: 0.035,
  }),
});

/**
 * @typedef {ppt.Protocol.Network.Initiator} InitiatorT
 * @typedef {ppt.Protocol.Runtime.StackTrace} StackTraceT
 * @typedef {{url?: string, lineNumber?: number, columnNumber?: number}} LocationObjT
 */

const cwd = process.cwd();

class InitiatorFormatter {
  constructor() {
    this.s = "";
    this.currIndent = 0;
  }

  reset() {
    this.s = "";
    this.currIndent = 0;
  }

  fmt(/** @type {ppt.HTTPRequest} */ req) {
    this.reset();
    this._fmt(req);
    return this.s;
  }
  print(/** @type {ppt.HTTPRequest} */ req) {
    console.log(this.fmt(req));
  }

  _fmt(/** @type {ppt.HTTPRequest} */ req) {
    let ini = req.initiator();
    if (!ini) return this.println("Initiator unknown");
    this.println("Initiator info:");
    this.indented(() => {
      this.println(`Type: ${ini.type}`);
      this.fmtURL(ini);
      if (ini.requestId) this.println(`Initiator request ID: ${ini.requestId}`);
      if (ini.stack) this.fmtAllStacks(ini.stack);
    });
  }

  indented(/** @type {() => void} */ callback) {
    this.currIndent += 2;
    callback();
    this.currIndent -= 2;
  }

  getIndent(/** @type {boolean} */ doIndent) {
    return doIndent ? " ".repeat(this.currIndent) : "";
  }
  println(/** @type {string} */ line, { doIndent = true } = {}) {
    this.s += this.getIndent(doIndent) + line + "\n";
  }
  beginLine(/** @type {string} */ s = "", { doIndent = true } = {}) {
    this.s += this.getIndent(doIndent) + s;
  }
  endLine(/** @type {string} */ s = "") {
    this.s += s + "\n";
  }

  fmtURL(/** @type {InitiatorT} */ ini) {
    if (!ini.url) return;
    // stringifyLocation uses .url, .columnNumber, .lineNumber
    this.println(`Initaitor location: ${this.stringifyLocation(ini)}`);
  }

  getNumStacks(/** @type {StackTraceT} */ base) {
    let curr = base;
    let i = 0;
    while (curr) {
      if (i >= 10_000) return null;
      i++;
      curr = curr.parent;
    }
    return i;
  }

  fmtAllStacks(/** @type {StackTraceT} */ stack) {
    this.println("Initiator stack:");
    let i = 0;
    this.indented(() => {
      let curr = stack;
      for (; i < 8 && curr; i++) {
        this.fmtSingleStack(curr, i);
        curr = curr.parent;
      }
    });
    this.fmtMoreStacksMsg(stack, /*nDisplayed*/ i);
  }
  fmtMoreStacksMsg(
    /** @type {StackTraceT} */ base,
    /** @type {number} */ nDisplayed
  ) {
    if (nDisplayed < 8) return;
    let nStacksTotal = this.getNumStacks(base);
    this.println(
      `(And ${nStacksTotal ? nStacksTotal - nDisplayed : "9999+"} more stacks)`
    );
  }
  fmtSingleStack(/** @type {StackTraceT} */ stack, /** @type {number} */ i) {
    this.println(`Stack ${i} (${stack.description ?? "<no description>"}):`);
    this.indented(() =>
      stack.callFrames.forEach(this.fmtStackFrame, /*thisArg*/ this)
    );
  }
  fmtStackFrame(/** @type {ppt.Protocol.Runtime.CallFrame} */ frame) {
    if (frame.functionName)
      this.println(
        `at ${frame.functionName} (${this.stringifyLocation(frame)})`
      );
    else this.println(`at ${this.stringifyLocation(frame)}`);
  }

  /**
   * Stringify a location using its `.url`, `.lineNumber` and `.columnNumber` properties
   */
  stringifyLocation(/** @type {LocationObjT} */ location) {
    let url = location.url || "<unknown>";
    let lineno = location.lineNumber == null ? null : location.lineNumber + 1;
    let colno =
      location.columnNumber == null ? null : location.columnNumber + 1;
    return (
      lineno && colno ? `${url}:${lineno}:${colno}`
      : lineno ? `${url}:${lineno}`
      : `${url}`
    );
  }
}
function fmtInitiatorInfo(/** @type {ppt.HTTPRequest} */ req) {
  return new InitiatorFormatter().fmt(req);
}

describe("The canvas WebGL rendering", () => {
  var /** @type {ppt.Browser} */ browser, /** @type {ppt.Page} */ page;
  var startupSuccess = false;
  beforeAll(async () => {
    browser = await ppt.launch({
      headless: true,
      args: ["--disable-web-security", "--use-gl=desktop"],
    }); // cors errors aagh!
    page = await browser.newPage();
    page.on("pageerror", (v) => {
      console.log("ERROR", v);
      throw v;
    });
    page.on("requestfailed", async (r) => {
      var s = `Request to ${r.url()} failed.\n${fmtInitiatorInfo(r)}`;
      console.log(s);
      browser.close();
      throw new Error(s);
    });
    await page.coverage.startJSCoverage({
      useBlockCoverage: true,
      includeRawScriptCoverage: true,
    });
    await page.goto(`file://${cwd}/index.html`, { waitUntil: "load" });
    await page.setViewport({ width: 1400, height: 1200 });
    startupSuccess = true;
  });

  var /** @type {ppt.ElementHandle} */ canvasH;
  it("renders the starting state", async () => {
    canvasH = await page.waitForSelector("#glCanvas");
    await page.waitForSelector(".pbar-overlay", { hidden: true });
    await waitForTickNo(page, 2, 600);
    const actualData = /** @type {Buffer} */ (await canvasH.screenshot());
    expect(actualData).toMatchImageSnapshot();
  }, 7000);

  it("Renders it correctly with different position", async () => {
    await page.evaluate(
      "game.player.position[0] += 2.3; game.player.position[1] += 0.4; game.player.position[2] += 1.0;"
    );
    await waitForNextTick(page);
    const actualData = /** @type {Buffer} */ (await canvasH.screenshot());
    expect(actualData).toMatchImageSnapshot();
  });

  it("Renders it correctly with rotation", async () => {
    await page.evaluate("game.player.rotation = {h: 57, v: 22};");
    await waitForNextTick(page);
    const actualData = /** @type {Buffer} */ (await canvasH.screenshot());
    expect(actualData).toMatchImageSnapshot();
  });

  it("Renders it correctly from the back", async () => {
    await page.evaluate(
      "game.player.rotation = {h: 240, v: -3}; game.player.position = [7.3, 4.9, 11.3];"
    );
    await waitForNextTick(page);
    const actualData = /** @type {Buffer} */ (await canvasH.screenshot());
    expect(actualData).toMatchImageSnapshot();
  });

  // pointerlock doesn't work for puppeteer
  // eslint-disable-next-line jest/no-disabled-tests
  it("gets the pointerlock", async () => {
    const canv_bbox = await canvasH.boundingBox();
    await page.mouse.click(
      canv_bbox.x + canv_bbox.width / 2,
      canv_bbox.y + canv_bbox.height / 2,
      { button: "left" }
    );
    await waitForNextTick(page);
    const hasPointerlock = await page.evaluate("game.hasPointerLock()");
    expect(hasPointerlock).toBe(true);
  });

  it("can find block in center of canvas", async () => {
    const blockAtCenter = await page.evaluate(
      "game.renderMgr.pickingRenderer.readCanvasCenter()"
    );
    console.log(blockAtCenter);
    expect(blockAtCenter).toStrictEqual([[1, 5, 2], 1]);
  });

  // TODO test for actual breking
  it("breaks the block at the center on left-click", async () => {
    expect(await page.evaluate("game.world.getBlock([1, 5, 2]).name")).not.toBe(
      "air"
    );
    await page.evaluate("game.hasPointerLock = () => true");
    await canvasH.click({ button: "left" });
    await waitForNextTick(page);
    await waitForPredicate(
      page,
      async () =>
        (await page.evaluate("game.world.getBlock([1, 5, 2]).name")) == "air"
    );
    expect(await page.evaluate("game.world.getBlock([1, 5, 2]).name")).toBe(
      "air"
    );
    expect(await canvasH.screenshot()).toMatchImageSnapshot();
  });

  it("Places block correctly on right-click", async () => {
    await page.evaluate(
      "game.player.rotation = {h: 291.2, v: 33.6}; game.player.position = [18.7, 5.9, 26];"
    );
    await waitForNextTick(page);
    await canvasH.click({ button: "right" });
    await waitForNextTick(page);
    await waitForPredicate(
      page,
      async () =>
        (await page.evaluate("game.world.getBlock([20, 2, 21]).name")) != "air"
    );
    expect(await page.evaluate("game.world.getBlock([20, 2, 21]).name")).toBe(
      "oak_log"
    );
    expect(await canvasH.screenshot()).toMatchImageSnapshot();
  });

  it("Remakes chunks on break (x and z adjacent)", async () => {
    await page.evaluate(
      "game.player.rotation = {h: 89, v: 90}; game.player.position = [7.4, 6.16, 7.58]"
    );
    await waitForNextTick(page);
    await canvasH.click({ button: "left" });
    await waitForNextTick(page);
    await waitForPredicate(
      page,
      async () =>
        (await page.evaluate("game.world.getBlock([7, 3, 7]).name")) == "air"
    );
    expect(await page.evaluate("game.world.getBlock([7, 3, 7]).name")).toBe(
      "air"
    );
    expect(await canvasH.screenshot()).toMatchImageSnapshot();
    //await page.waitForSelector('qqqqqqqqwqq-qqq', {timeout: 600000});
  });

  afterAll(async () => {
    if (!startupSuccess) {
      browser.close();
      return;
    }
    canvasH.dispose();
    const browserCoverage = await page.coverage.stopJSCoverage();
    browser.close();
    // for just ppt coverage
    covToIstanbul.write(browserCoverage, {
      storagePath: "./test/coverage-puppeteer",
    });
    // for merged coverage, also save the whole thing
    await fs.promises.mkdir("./test/coverage-ppt-raw/", { recursive: true });
    fs.promises.writeFile(
      "./test/coverage-ppt-raw/out.json",
      JSON.stringify(browserCoverage)
    );
  });
});

/**
 * @param {ppt.Page} page
 */
async function waitForNextTick(page) {
  await waitForTickNo(page, (await getTickNo(page)) + 1, 250);
}

/**
 * @param {ppt.Page} page
 * @returns {Promise<number>}
 */
async function getTickNo(page) {
  return /** @type {number} */ (await page.evaluate("game.tickNo"));
}

/**
 * @param {ppt.Page} page
 * @param {number} targetNo
 * @param {number} [timeout=500]
 * @param {number} [interval=10]
 */
async function waitForTickNo(page, targetNo, timeout = 500, interval = 10) {
  for await (const startTime of timersPromises.setInterval(
    interval,
    performance.now()
  )) {
    const now = performance.now();
    if (now > startTime + timeout)
      throw new TimeoutError(
        `waitForTickNo took too long (longer than ${timeout}ms)`
      );
    const tickNo = /** @type {number} */ (await page.evaluate("game.tickNo"));
    if (tickNo >= targetNo) return;
  }
}

/**
 * @param {ppt.Page} page
 * @param {(page: ppt.Page) => Promise<boolean>} pred
 * @param {number} [timeout=500]
 * @param {number} [interval=10]
 * @returns {Promise<boolean>} Returns true if successful, false on timeout
 */
async function waitForPredicate(page, pred, timeout = 500, interval = 10) {
  for await (const startTime of timersPromises.setInterval(
    interval,
    performance.now()
  )) {
    const now = performance.now();
    if (now > startTime + timeout) {
      return false;
    }
    if (await pred(page)) {
      return true;
    }
  }
}
