import {GameComponent} from './game_component.js';
import {fromNested, exportAs, assert, roundNearest, nearRoundNearest} from './utils.js';

export var SIZE = [16, 16, 16];
export var LOW = [-8, -8, -8];
export var HIGH = vec3.add([], LOW, SIZE);

export class World extends GameComponent {
  constructor(game, low=LOW, size=SIZE){
    super(game);
    
    // this.center = center.slice();  // NOTE: may be overwritten
    this.size = size.slice();
    this.low = low.slice();
    this.origin = this.low;
    // this.calcValues();
    
    this.blocks = fromNested(this.size, _ => Blocks.air);
  }

  // calcValues(){
  //   this.calcCubeRadii();
  //   this.low = vec3.sub([], this.center, this.lRadius);
  //   this.high = vec3.add([], this.center, this.hRadius);
  //   this.origin = this.low;
  // }

  // calcCubeRadii(){
  //   let _hl_rads = [0,1,2].map((i) => getHLRadius(this.size[i], this.center[i]));
  //   this.lRadius = _hl_rads.map(v=>v.l);
  //   this.hRadius = _hl_rads.map(v=>v.h);
  //   this.center = _hl_rads.map(v=>v.center);
  // }
  
  getBlock(at){
    const [x,y,z] = this.getIndex(at);
    return this.blocks[x][y][z];
  }

  setBlock(at, block=Blocks.air){
    const [x,y,z] = this.getIndex(at);
    return (this.blocks[x][y][z] = block);
  }

  setBlocks(block, positions){
    for(const p of positions){
      this.setBlock(p, block);
    }
  }

  getIndex(at){
    return vec3.sub([], at, this.origin);
  }

  getPos(at){
    return vec3.add([], at, this.origin);
  }

  *[Symbol.iterator]() {
    for(let x=0; x<this.size[0]; x++){
      for(let y=0; y<this.size[1]; y++){
        for(let z=0; z<this.size[2]; z++){
          let val = [this.getPos([x, y, z]), this.blocks[x][y][z]];
          yield val;
        }
      }
    }
  }
}

export var Blocks = {
  air : 0,
  grass: 1,
};

// in 1 dimension (scalar integer values)
function getHLRadius(size, center){
  size = nearRoundNearest(size, 0.5);
  center = nearRoundNearest(center, 1);
  let isHalfCenter = center%1==0.5;
  let isOddSize = size%2==1;
  if(isOddSize == isHalfCenter){
    return {l: size/2, h: size/2, center: center};
  }
  console.log('!WARN! odd size OR non-int center (not both): what to do??');
  if(isOddSize && !isHalfCenter){
    return {l: Math.floor(size/2), h: Math.ceil(size/2),
            center: center};
  }
  throw new Error("Even size but .5 center");
}

exportAs(World);
