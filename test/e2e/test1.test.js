import timersPromises from "node:timers/promises";
import fs from 'node:fs';

import {describe, it, beforeAll, expect} from "@jest/globals";
import ppt, { TimeoutError } from 'puppeteer';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import covToIstanbul from 'puppeteer-to-istanbul';
import v8ToIstanbul from 'v8-to-istanbul';


expect.extend({ toMatchImageSnapshot });


const cwd = process.cwd();


describe("The canvas WebGL rendering", () => {
  var /** @type {ppt.Browser} */browser, /** @type {ppt.Page} */page, start;
  beforeAll(async () => {
    start = performance.now();
    browser = await ppt.launch({headless: 'new', args: ['--disable-web-security']});  // cors errors aagh!
    console.log("Launched", performance.now() - start, 'ms');
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
    console.log("New page done", performance.now() - start, 'ms');
    await page.coverage.startJSCoverage({useBlockCoverage: true, includeRawScriptCoverage: true});
    await page.goto(`file://${cwd}/index.html`, {waitUntil: "load"});
    console.log("Navigated", performance.now() - start, 'ms');
    await page.setViewport({width: 1400, height: 1200});
    console.log("Viewport-ed", performance.now() - start, 'ms');
  });

  var /** @type {ppt.ElementHandle} */canvasH;
  it("renders the starting state", async () => {
    canvasH = await page.waitForSelector("#glCanvas");
    console.log("Done glCanvas", performance.now() - start, 'ms');
    await page.waitForSelector(".pbar-overlay", {hidden : true});
    console.log("Done pbar-overlay", performance.now() - start, 'ms');
    await waitForTickNo(page, 2, 600);

    const actualData = /** @type {Buffer} */(await canvasH.screenshot());
    // @ts-ignore
    expect(actualData).toMatchImageSnapshot();
  }, 7000);

  it("Renders it correctly with different position", async () => {
    await page.evaluate('game.player.position[0] += 2.3; game.player.position[1] += 0.4; game.player.position[2] += 1.0;');
    await waitForNextTick(page);
    const actualData = /** @type {Buffer} */(await canvasH.screenshot());
    // @ts-ignore
    expect(actualData).toMatchImageSnapshot();
  });

  it("Renders it correctly with rotation", async () => {
    await page.evaluate('game.player.rotation = {h: 57, v: 22};');
    await waitForNextTick(page);
    const actualData = /** @type {Buffer} */(await canvasH.screenshot());
    // @ts-ignore
    expect(actualData).toMatchImageSnapshot();
  });

  it("Renders it correctly from the back", async () => {
    await page.evaluate('game.player.rotation = {h: 240, v: -3}; game.player.position = [7.3, 4.9, 11.3]');
    await waitForNextTick(page);
    const actualData = /** @type {Buffer} */(await canvasH.screenshot());
    // @ts-ignore
    expect(actualData).toMatchImageSnapshot();
  });

  afterAll(async () => {
    canvasH.dispose();
    const browserCoverage = await page.coverage.stopJSCoverage();
    browser.close();
    covToIstanbul.write(browserCoverage, {storagePath: './test/coverage-puppeteer'});
    await fs.promises.mkdir("./test/coverage/ppt-raw-v8/", {recursive: true});
    fs.promises.writeFile("./test/coverage/ppt-raw-v8/out.json", JSON.stringify(browserCoverage));
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
