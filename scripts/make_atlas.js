import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import nodeCanvas from "canvas";


/**
 * @param {string} dir
 */
async function getTexturePaths(dir) {
  let filenames = await fs.promises.readdir(dir);
  let paths = [];
  // todo recursive? command line switch??
  for (const fn of filenames) {
    let p = path.join(dir, fn);
    if (isTextureFile(p)) {
      paths.push(p);
    }
  }
  return paths;
}

/**
 * @param {string} f
 */
function isTextureFile(f) {
  return f.endsWith(".min.png");
}

/**
 * @param {nodeCanvas.CanvasRenderingContext2D} ctx
 * @param {nodeCanvas.Image} img
 * @param {number} i
 */
function drawNthImage(ctx, img, i) {
  ctx.drawImage(img, i * 16, 0);
}

async function main() {
  console.log("Finding textures...");
  const paths = await getTexturePaths("./textures/");

  console.log("Creating canvas...");
  var canv = nodeCanvas.createCanvas(paths.length * 16, 16);
  var ctx = canv.getContext("2d");

  console.log("Drawing images...");  
  const namesList = await Promise.all(paths.map(async (imgPath, i) => {
    const img = await nodeCanvas.loadImage(imgPath);
    drawNthImage(ctx, img, i);
    return path.basename(imgPath, ".min.png");
  }));
  await Promise.all([
    (async () => {
      console.log("Creating atlas...");
      await writeToPng(canv, "./res/atlas.png");
    })(),
    (async () => {
      console.log("Indexing textures...");
      await fs.promises.writeFile("./res/atlas-index.json", JSON.stringify(namesList));
    })(),
  ]);
  console.log("Finished!");
}

/**
 * @param {nodeCanvas.Canvas} canv
 * @param {string} file
 */
function writeToPng(canv, file) {
  const out = fs.createWriteStream(file);
  const png_stream = canv.createPNGStream();
  return pipeline(png_stream, out);
}

await main();
