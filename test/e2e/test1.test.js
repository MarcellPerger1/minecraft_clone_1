import timersPromises from "node:timers/promises";
import fs from 'node:fs';

import {describe, it, beforeAll, expect} from "@jest/globals";
import ppt, { TimeoutError } from 'puppeteer';
import jestImageSnapshot from 'jest-image-snapshot';
import covToIstanbul from 'puppeteer-to-istanbul';
// for types:
import './_image_snapshot_types/image_snapshot_types.js';


expect.extend({ toMatchImageSnapshot: jestImageSnapshot.configureToMatchImageSnapshot({failureThresholdType: 'percent', failureThreshold: 0.02}) });


const cwd = process.cwd();


describe("The canvas WebGL rendering", () => {
  var /** @type {ppt.Browser} */browser, /** @type {ppt.Page} */page;
  beforeAll(async () => {
    browser = await ppt.launch({headless: 'new', args: ['--disable-web-security']});  // cors errors aagh!
    page = await browser.newPage();
    page.on('pageerror', (v) => {
      console.log("ERROR", v);
      throw v;
    });
    page.on('requestfailed', (r) => {
      var s = `Request to ${r.url()} failed`;
      console.log(s);
      browser.close();
      throw new Error(s);
    });
    await page.coverage.startJSCoverage({useBlockCoverage: true, includeRawScriptCoverage: true});
    await page.goto(`file://${cwd}/index.html`, {waitUntil: "load"});
    await page.setViewport({width: 1400, height: 1200});
  });

  var /** @type {ppt.ElementHandle} */canvasH;
  it("renders the starting state", async () => {
    canvasH = await page.waitForSelector("#glCanvas");
    await page.waitForSelector(".pbar-overlay", {hidden : true});
    await waitForTickNo(page, 2, 600);
    const actualData = /** @type {Buffer} */(await canvasH.screenshot());
    expect(actualData).toMatchImageSnapshot();
  }, 7000);

  it("Renders it correctly with different position", async () => {
    await page.evaluate('game.player.position[0] += 2.3; game.player.position[1] += 0.4; game.player.position[2] += 1.0;');
    await waitForNextTick(page);
    const actualData = /** @type {Buffer} */(await canvasH.screenshot());
    expect(actualData).toMatchImageSnapshot();
  });

  it("Renders it correctly with rotation", async () => {
    await page.evaluate('game.player.rotation = {h: 57, v: 22};');
    await waitForNextTick(page);
    const actualData = /** @type {Buffer} */(await canvasH.screenshot());
    expect(actualData).toMatchImageSnapshot();
  });

  it("Renders it correctly from the back", async () => {
    await page.evaluate('game.player.rotation = {h: 240, v: -3}; game.player.position = [7.3, 4.9, 11.3];');
    await waitForNextTick(page);
    const actualData = /** @type {Buffer} */(await canvasH.screenshot());
    expect(actualData).toMatchImageSnapshot();
  });

  // pointerlock doesn't work for puppeteer
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("gets the pointerlock", async () => {
    const canv_bbox = await canvasH.boundingBox();
    await page.mouse.click(canv_bbox.x + canv_bbox.width / 2, canv_bbox.y + canv_bbox.height / 2, {button: "left"});
    await waitForNextTick(page);
    const hasPointerlock = await page.evaluate("game.hasPointerLock()");
    expect(hasPointerlock).toBe(true);
  });

  it("can find block in center of canvas", async () => {
    const blockAtCenter = await page.evaluate('game.renderMgr.pickingRenderer.readCanvasCenter()');
    console.log(blockAtCenter);
    expect(blockAtCenter).toStrictEqual([[1, 5, 2], 1]);
  });

  // TODO test for actual breking
  it("breaks the block at the center on left-click", async () => {
    expect(await page.evaluate('game.world.getBlock([1, 5, 2]).name')).not.toBe('air');
    await page.evaluate("game.hasPointerLock = () => true");
    await canvasH.click({button:'left'});
    await waitForNextTick(page);
    await waitForPredicate(page, async () => await page.evaluate('game.world.getBlock([1, 5, 2]).name') == 'air');
    expect(await page.evaluate('game.world.getBlock([1, 5, 2]).name')).toBe('air');
    expect(await canvasH.screenshot()).toMatchImageSnapshot();
  });

  afterAll(async () => {
    canvasH.dispose();
    const browserCoverage = await page.coverage.stopJSCoverage();
    browser.close();
    // for just ppt coverage
    covToIstanbul.write(browserCoverage, {storagePath: './test/coverage-puppeteer'});
    // for merged coverage, also save the whole thing
    await fs.promises.mkdir("./test/coverage-ppt-raw/", {recursive: true});
    fs.promises.writeFile("./test/coverage-ppt-raw/out.json", JSON.stringify(browserCoverage));
  });
});


/**
 * @param {ppt.Page} page
 */
async function waitForNextTick(page) {
  await waitForTickNo(page, await getTickNo(page) + 1, 250);
}


/**
 * @param {ppt.Page} page
 * @returns {Promise<number>}
 */
async function getTickNo(page) {
  return /** @type {number} */(await page.evaluate('game.tickNo'));
}


/**
 * @param {ppt.Page} page
 * @param {number} targetNo
 * @param {number} [timeout=500] 
 * @param {number} [interval=10] 
 */
async function waitForTickNo(page, targetNo, timeout=500, interval=10) {
  for await (const startTime of timersPromises.setInterval(interval, performance.now())) {
    const now = performance.now();
    if (now > startTime + timeout) throw new TimeoutError(`waitForTickNo took too long (longer than ${timeout}ms)`)
    const tickNo = /** @type {number} */(await page.evaluate('game.tickNo'));
    if(tickNo >= targetNo) return;
  }
}

/**
 * @param {ppt.Page} page
 * @param {(page: ppt.Page) => Promise<boolean>} pred
 * @param {number} [timeout=500] 
 * @param {number} [interval=10]
 * @returns {Promise<boolean>} Returns true if successful, false on timeout
 */
async function waitForPredicate(page, pred, timeout=500, interval=10) {
  for await (const startTime of timersPromises.setInterval(interval, performance.now())) {
    const now = performance.now();
    if (now > startTime + timeout) { return false; }
    if (await pred(page)) { return true; }
  }
}
