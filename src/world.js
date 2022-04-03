import {GameComponent} from './game_component.js';
import {forRange, fromNested, exportAs} from './utils.js';

export var SIZE = [16, 16, 16];
export var LOW = [-8, 8, -8];
export var HIGH = vec3.add([], LOW, SIZE);

export class World extends GameComponent {
  constructor(game, size=SIZE){
    super(game);
    this.size = size.slice();
    this.blocks = fromNested(this.size, _ => Blocks.air);
  }
  
  getBlock(at){
    const [x,y,z] = at;
    return this.blocks[x][y][z];
  }

  setBlock(at, block){
    const [x,y,z] = at;
    return (this.blocks[x][y][z] = block);
  }
}

export var Blocks = {
  air : 0,
  grass: 1,
};


exportAs(World);
