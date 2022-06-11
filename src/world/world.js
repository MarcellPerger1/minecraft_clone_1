import {fromNested, exportAs, assert} from '../utils.js';
import {GameComponent} from '../game_component.js';

import {Blocks} from './block_type.js';


export var SIZE = [16, 16, 16];
export var LOW = [-8, -8, -8];
export var HIGH = vec3.add([], LOW, SIZE);


export class World extends GameComponent {
  constructor(game, low=LOW, size=SIZE){
    super(game);
    
    this.size = size.slice();
    this.low = low.slice();
    this.high = vec3.add(vec3.create(), this.low, this.size);
    this.origin = this.low;
    
    this.blocks = fromNested(this.size, _ => Blocks.air);
  }

  getBlock(at){
    this.wantInRange(at);
    const [x,y,z] = this.getIndex(at);
    return this.blocks[x][y][z];
  }

  getBlockUnsafe(at){
    return this.blocks
      [at[0]-this.origin[0]]
      [at[1]-this.origin[1]]
      [at[2]-this.origin[2]]
  }

  setBlock(at, block=Blocks.air){
    this.wantInRange(at);
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

  inRange(pos){
    return [0,1,2].every((i) => (this.low[i] <= pos[i] && pos[i] < this.high[i]));
  }

  wantInRange(pos, msg="Position out of range"){
    assert(this.inRange(pos), msg);
  }

  *[Symbol.iterator]() {
    for(let x=0; x<this.size[0]; x++){
      let at_x = this.blocks[x];
      for(let y=0; y<this.size[1]; y++){
        let at_xy = at_x[y];
        for(let z=0; z<this.size[2]; z++){
          let at_xyz = at_xy[z];
          let val = [this.getPos([x, y, z]), at_xyz];
          yield val;
        }
      }
    }
  }
}


exportAs(World);
