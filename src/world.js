import {GameComponent} from './game_component.js';
import {forRange, fromNested, exportAs} from './utils.js';

export var SIZE = [16, 16, 16];
export var LOW = [-8, 8, -8];
export var HIGH = vec3.add([], LOW, SIZE);

export class World extends GameComponent {
  constructor(game){
    super(game);
    this.blocks = fromNested(SIZE, _ => 0);
  }
  
  getBlock(x, y, z){
    
  }
}

exportAs(World);
