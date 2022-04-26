import SimplexNoise from "../libs/simplex-noise/simplex-noise.js";

import { GameComponent } from "../game_component.js";
import { World, Blocks } from "../world.js";


export class WorldGenerator extends GameComponent {
  constructor(game) {
    super(game);
    this.init();
    this.ns = new SimplexNoise(this.gcnf.seed);
  }

  get gcnf() {
    return this.cnf.generation;
  }

  get wSize() {
    return this.gcnf.wSize;
  }

  init() {
    this.w = new World(this.game, [0, 0, 0], this.wSize);
  }

  generate() {
    return this.gcnf.isTestWorld ?
      this.generateTestWorld()
      : this.generateTerrain();
  }

  generateTerrain() {
    for (let x = 0; x < this.wSize[0]; x++) {
      for (let z = 0; z < this.wSize[2]; z++) {
        let y = Math.round(
          this.gcnf.nScale[1] * (1 + this.ns.noise2D(
            x / this.gcnf.nScale[0], z / this.gcnf.nScale[2]
          ))
        );
        this.w.setBlock([x, y, z], Blocks.grass);
        while (y--) {
          this.w.setBlock([x, y, z], Blocks.dirt);
        }
      }
    }
    return this.w;
  }

  generateTestWorld() {
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 8; z++) {
        this.w.setBlock([x, 0, z], Blocks[(x + z + 1) % Blocks.count]);
      }
    }
    this.w.setBlock([15, 0, 0], Blocks.grass);
    this.w.setBlock([0, 0, 15], Blocks.grass);
    this.w.setBlock([0, 3, 0], Blocks.grass);
    return this.w;
  }
}
