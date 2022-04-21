import SimplexNoise from "../../simplex-noise/dist/esm/simplex-noise.js";

import { GameComponent } from "../game_component.js";
import { World, Blocks } from "../world.js";


export class WorldGenerator extends GameComponent{
  constructor(game){
    super(game);
    this.init();
    this.ns = new SimplexNoise('secret-seed');
  }

  init(){
    this.w = new World(this.game, [0,0,0]);
  }
  
  generate(){
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        let y = 3+Math.round(2*this.ns.noise2D(x/11.14,z/11.14))
        this.w.setBlock([x, y, z], Blocks.grass);
        while(y--){
          this.w.setBlock([x, y, z], Blocks.dirt);
        }
      }
    }
    // this.w.setBlock([15, 0, 0], Blocks.grass);
    // this.w.setBlock([0, 0, 15], Blocks.grass);
    // this.w.setBlock([0, 3, 0], Blocks.grass);
    return this.w;
  }
}
