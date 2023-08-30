import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from 'node:url';

import nodeCanvas from "canvas";


const dirname = path.dirname(fileURLToPath(import.meta.url));


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

function isTextureFile(f) {
  return f.endsWith(".min.png");
}

/**
 * @param {boolean} trustCwd is cwd set properly (ie. to project root)
 **/
function getProjectRoot(trustCwd = true) {
  return trustCwd ? path.resolve() : path.resolve(dirname, "..");
}

/**
 * @param {nodeCanvas.CanvasRenderingContext2D} ctx
 * @param {nodeCanvas.Image} img
 * @param {number} i
 */
function drawNthImage(ctx, img, i) {
  ctx.drawImage(img, i * 16, 0);
}

function main() {
  const root = getProjectRoot();
  const resDir = path.resolve(root, "res/");
  const texDir = path.resolve(root, "textures/");
  var /** @type {nodeCanvas.Canvas} */canv;
  var /** @type {nodeCanvas.CanvasRenderingContext2D} */ctx
  var /** @type {number} */n;
  var i = 0;
  var data = [];
  console.log("Finding textures...");
  const ondrawn = getTexturePaths(texDir).then((paths) => {
    n = paths.length;
    console.log("Creating canvas...");
    canv = nodeCanvas.createCanvas(n * 16, 16);
    ctx = canv.getContext("2d");
    console.log("Drawing images...");
    return Promise.all(
      paths.map((p) =>
        nodeCanvas.loadImage(p).then((img) => {
          drawNthImage(ctx, img, i++);
          let nm = path.basename(p, ".min.png");
          data.push(nm);
        })
      )
    );
  });
  let ondone = Promise.all([
    ondrawn.then((_) => {
      console.log("Creating atlas...");
      return writeToPng(canv, path.join(resDir, "atlas.png"));
    }),
    ondrawn.then((_) => {
      console.log("Indexing textures...");
      let s = JSON.stringify(data);
      return fs.promises.writeFile(path.join(resDir, "atlas-index.json"), s);
    }),
  ]);
  ondone.then((_) => {
    console.log("Finished!");
  });
}

/**
 * @param {nodeCanvas.Canvas} canv
 * @param {string} dir
 */
function writeToPng(canv, dir) {
  const out = fs.createWriteStream(dir);
  const png_stream = canv.createPNGStream();
  return pipeline(png_stream, out);
}

main();
