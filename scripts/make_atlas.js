const fs = require('fs');
const path = require('path');
const util = require('util');
const {createCanvas, loadImage} = require('canvas');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

function readFromDir(dir){
  return readdir(dir)
    .then((files) => {
      return files.map((f) => readImage(f))
    })
}

function readImage(f){
  return stat(f).then((st) => {
    if(st.isFile() && f.endsWith('.min.png')){
      return loadImage(f);
    }
  });
}

function drawImages(ctx, images){
  for(const img of images){
    ctx.drawImage(img, x, y);
  }
}

/**
* @param trustCwd {boolean} is cwd set properly (ie. to project root)
**/
function getTexturesDir(trustCwd=true){
  return trustCwd ? path.resolve('textures/') : path.resolve(__dirname, '../textures');
}

function main(){
  const canv = createCanvas();
  const ctx = canv.getContext('2d');
  readFromDir(__dirname).then((images) => drawImages(ctx, images));
}

console.log('Hello nodejs');
console.log(`dirname: ${getTexturesDir()}`);
