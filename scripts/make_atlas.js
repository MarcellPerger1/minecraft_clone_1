const fs = require('fs');
const fsP = fs.promises;
const path = require('path');
const { pipeline } = require('stream/promises');
const {createCanvas, loadImage} = require('canvas');


function readFromDir(dir, c){
  return fsP.readdir(dir)
    .then(async (files) => {
      let imgs = [];
      for(const f of files){
        let img = await readImage(path.join(dir, f));
        if(img!=null){
          imgs.push(img);
        }
      }
      return imgs;
    })
}

async function readImage(f, c){
  return fsP.stat(f).then((st) => {
    if(st.isFile() && f.endsWith('.min.png') && !f.endsWith('atlas.min.png')){
      let v = loadImage(f);
      if(c!=null){
        v = v.then(c);
      }
      return v;
    }
  });
}

function isTextureFile(f){
  return f.endsWith('.min.png') && !f.endsWith('atlas.min.png')
}


/**
* @param trustCwd {boolean} is cwd set properly (ie. to project root)
**/
function getTexturesDir(trustCwd=true){
  return trustCwd ? path.resolve('textures/') : path.resolve(__dirname, '../textures');
}

function main_old(){
  const texDir = getTexturesDir();
  var canv, ctx, n;
  console.log('Loading images...')
  return readFromDir(texDir).then(async (images) => {
    console.log('Creating canvas...')
    n = images.length;
    canv = createCanvas(n*16, 16);
    ctx = canv.getContext('2d');
    console.log('Drawing images...');
    return Promise.all(
      images.map((img, i) => ctx.drawImage(img, i*16, 0))
    )
  }).then((_r) => {
    console.log('Creating atlas...');
    const out = fs.createWriteStream(path.join(texDir, 'atlas.min.png'));
    const png_stream = canv.createPNGStream();
    pipeline(png_stream, out).then((_res) => {
      console.log('Finished!');
    });
  });
}

function imgOntoCanvas(ctx, img, i){
  ctx.drawImage(img, i*16, 0);
}

function main(){
  const texDir = getTexturesDir();
  var canv, ctx, n;
  var i = 0;
  fsP.readdir(texDir).then(async (filenames) => {
    console.log('Finding textures...');
    let paths = [];
    for(const fn of filenames){
      let p = path.join(texDir, fn);
      if(isTextureFile(p)){
        paths.push(p);
      }
    }
    console.log('Creating canvas...');
    n = paths.length;
    canv = createCanvas(n*16, 16);
    ctx = canv.getContext('2d');
    console.log('Drawing images...');
    return Promise.all(
      paths.map(p => 
        loadImage(p).then(img => imgOntoCanvas(ctx, img, i++))
    ));
  }).then((_r) => {
    console.log('Creating atlas...');
    writeToPng(canv, path.join(texDir, 'atlas.min.png')).then((_res) => {
      console.log('Finished!');
    });
  });
}

function writeToPng(canv, dir){
  const out = fs.createWriteStream(dir);
  const png_stream = canv.createPNGStream();
  return pipeline(png_stream, out);
}

main();
