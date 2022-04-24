import SimplexNoise from "../libs/simplex-noise/simplex-noise.js";

import { GameComponent } from "../game_component.js";
import { World, Blocks } from "../world.js";


export class WorldGenerator extends GameComponent{
  constructor(game){
    super(game);
    this.init();
    this.ns = new SimplexNoise(this.cnf.seed);
  }

  init(){
    this.w = new World(this.game, [0,0,0]);
  }
  
  generate(){
    return this.cnf.isTestWorld ? this.generateTestWorld() : this.generateTerrain();
  }

  generateTerrain(){
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        let y = Math.round(2*(1 + this.ns.noise2D(x/11.14,z/11.14)))
        this.w.setBlock([x, y, z], Blocks.grass);
        while(y--){
          this.w.setBlock([x, y, z], Blocks.dirt);
        }
      }
    }
    return this.w;
  }

  generateTestWorld(){
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 8; z++) {
        this.w.setBlock([x, 0, z], Blocks[(x+z+1)%Blocks.count]);
      }
    }
    this.w.setBlock([15, 0, 0], Blocks.grass);
    this.w.setBlock([0, 0, 15], Blocks.grass);
    this.w.setBlock([0, 3, 0], Blocks.grass);
    return this.w;
  }
}
