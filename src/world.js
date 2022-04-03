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

  addToRender(){
    nestedFor(this.blocks, (v, p) => {
      if(v!=Blocks.air){
        this.r.addGrassBlock(this.getPos(p));
      }
    });
  }
}

export var Blocks = {
  air : 0,
  grass: 1,
};


exportAs(World);
