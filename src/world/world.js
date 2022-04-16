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
      for(let y=0; y<this.size[1]; y++){
        for(let z=0; z<this.size[2]; z++){
          let val = [this.getPos([x, y, z]), this.blocks[x][y][z]];
          yield val;
        }
      }
    }
  }
}


exportAs(World);
