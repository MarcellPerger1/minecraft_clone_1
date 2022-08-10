const fs = require('fs');
const fsP = fs.promises;
const path = require('path');
const { pipeline } = require('stream/promises');
const {createCanvas, loadImage} = require('canvas');


async function getTexturePaths(dir){
  let filenames = await fsP.readdir(dir);
  let paths = [];
  // todo recursive? command line switch??
  for(const fn of filenames){
    let p = path.join(dir, fn);
    if(isTextureFile(p)){
      paths.push(p);
    }
  }
  return paths;
}

function isTextureFile(f){
  return f.endsWith('.min.png')
}

/**
* @param trustCwd {boolean} is cwd set properly (ie. to project root)
**/
function getProjectRoot(trustCwd=true){
  return trustCwd ? 
    path.resolve() 
    : path.resolve(__dirname, '..');
}

function drawNthImage(ctx, img, i){
  ctx.drawImage(img, i*16, 0);
}

function main(){
  const root = getProjectRoot();
  const resDir = path.resolve(root, 'res/');
  const texDir = path.resolve(root, 'textures/');
  var canv, ctx, n;
  var i = 0;
  var data = [];
  console.log('Finding textures...');
  const ondrawn = getTexturePaths(texDir).then((paths) => {
    n = paths.length;
    console.log('Creating canvas...');
    canv = createCanvas(n*16, 16);
    ctx = canv.getContext('2d');
    console.log('Drawing images...');
    return Promise.all(
      paths.map(p => 
        loadImage(p).then(img => {
          drawNthImage(ctx, img, i++);
          let nm = path.basename(p, '.min.png');
          data.push(nm);
        })
    ));
  })
  let ondone = Promise.all([
    ondrawn.then((_) => {
      console.log('Creating atlas...');
      return writeToPng(canv, path.join(resDir, 'atlas.png'));
    }), ondrawn.then((_) => {
      console.log('Indexing textures...');
      let s = JSON.stringify(data);
      return fsP.writeFile(path.join(resDir, 'atlas-index.json'), s);
    })
  ])
  ondone.then((_) => {
    console.log('Finished!');
  });
  
}

function writeToPng(canv, dir){
  const out = fs.createWriteStream(dir);
  const png_stream = canv.createPNGStream();
  return pipeline(png_stream, out);
}

main();
