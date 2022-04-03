import {GameComponent} from './game_component.js';
import {forRange, fromNested, nestedFor, exportAs} from './utils.js';

export var SIZE = [16, 16, 16];
export var LOW = [-8, -8, -8];
export var HIGH = vec3.add([], LOW, SIZE);

export class World extends GameComponent {
  constructor(game, offset=[0,0,0], size=SIZE, low=LOW){
    super(game);
    this.offset = offset.slice();  // global offset
    this.local_low = low.slice();
    this.size = size.slice();
    
    this.low = vec3.add([], this.offset, this.local_low);
    this.high = this.low + this.size;
    
    this.origin = vec3.scale([], this.low, -1);
    
    this.blocks = fromNested(this.size, _ => Blocks.air);
  }
  
  getBlock(at){
    const [x,y,z] = this.getIndex(at);
    return this.blocks[x][y][z];
  }

  setBlock(at, block=Block.air){
    const [x,y,z] = this.getIndex(at);
    return (this.blocks[x][y][z] = block);
  }

  setBlocks(block, positions){
    for(const p of positions){
      this.setBlock(p, block);
    }
  }

  getIndex(at){
    return vec3.add([], this.origin, at);
  }

  getPos(at){
    return vec3.sub([], at, this.origin);
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


exportAs(World);
