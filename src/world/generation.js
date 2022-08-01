import SimplexNoise from "../libs/simplex-noise/simplex-noise.js";

import { rangeList } from "../utils.js";
import { GameComponent } from "../game_component.js";
import { World, Blocks } from "../world.js";


export class WorldGenerator extends GameComponent {
  constructor(game) {
    super(game);
    this.init();
    this.seeds = this.getSeeds(this.gcnf.seed, "base-terrain", 5);
    this.noises = this.seeds.map(s => new SimplexNoise(s))
  }
 
  getSeedExtra(what, index){
    return (index == 0 ? "" : `.!${what}[${index}]`)
  }

  getSeed(orig, what, index){
    return toString(orig) + this.getSeedExtra(what, index);
  }

  getSeeds(seed, what, n){
    // get `n` seeds from a single seed]
    return rangeList(n).map(i => this.getSeed(seed, what, i))
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
        let y = this.getHeightAt(x, z);
        if(y<0){
          console.warn("Negative noise value in generation. Consider increasing noiseMedian");
          continue;
        }
        this.w.setBlock([x, y, z], Blocks.grass);
        while (y--) {
          this.w.setBlock([x, y, z], Blocks.dirt);
        }
      }
    }
    return this.w;
  }

  getHeightAt(x, z) {
    let ny = 0;
    let xm = this.gcnf.nScale[0];
    let zm = this.gcnf.nScale[2];
    let ym = this.gcnf.nScale[1];
    for(let i=0;i<5;i++){
      ny += ym * this.noises[i].noise2D(x / xm, z / zm);
      xm *= this.gcnf.octaveMult[0];
      ym *= this.gcnf.octaveMult[1];
      zm *= this.gcnf.octaveMult[2];
    }
    let fval = this.gcnf.nScale[1] * (3 + ny)
    return Math.round(fval);
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

function _mash(v, bits){
    var rpt = 1<<bits;
    var r = (12345678.91011*v+12345.6789*v*v-123.456789-1234.56789*v*v*v+Math.cos(12.345*v-1.23*v*v+3.14)-Math.pow((v+3.1415)*Math.cos((v+1.23)*(v-2.718)), 7)*27.18+Math.sin((v+1.23)*(v-3.14159)*v-1234))%rpt
    return Math.floor(r>0 ? r : r+rpt)
}
