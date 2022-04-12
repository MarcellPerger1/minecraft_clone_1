const fs = require('fs');
const fsP = fs.promises;
const path = require('path');
const { pipeline } = require('stream/promises');
const {createCanvas, loadImage} = require('canvas');


function readFromDir(dir){
  return fsP.readdir(dir)
    .then((files) => {
      return files.map((f) => readImage(f))
    })
}

function readImage(f){
  return fsP.stat(f).then((st) => {
    if(st.isFile() && f.endsWith('.min.png')){
      return loadImage(f);
    }
  });
}


/**
* @param trustCwd {boolean} is cwd set properly (ie. to project root)
**/
function getTexturesDir(trustCwd=true){
  return trustCwd ? path.resolve('textures/') : path.resolve(__dirname, '../textures');
}

function main(){
  const texDir = getTexturesDir();
  var canv, ctx, n;
  cnosole.log('Loading images..')
  readFromDir(texDir).then((images) => {
    console.log('Creating canvas...')
    n = images.length;
    canv = createCanvas(n*16, 16);
    ctx = canv.getContext('2d');
    console.log('Drawing images..')
    for(const [i, img] of Object.entries(images)){
      ctx.drawImage(img, i*16, 0);
    }
  }).then((_r) => {
    console.log('Creating atlas..');
    const out = fs.createWriteStream(path.join(texDir, 'atlas.min.png'));
    const png_stream = canv.createPNGStream();
    pipeline(png_stream, out).then((_res) => {
      console.log('Finished!');
    });
  });
}

console.log('Hello nodejs');
console.log(`dirname: ${getTexturesDir()}`);
