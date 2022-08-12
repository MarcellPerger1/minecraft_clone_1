import { GameComponent } from "../game_component.js";
import { rangeList } from "../utils.js";

import { World } from "./world.js";
import { Blocks } from "./block_type.js";
import { OctaveNoise } from "./octave_noise.js";
import { TreePosGetter } from "./tree_generation.js";


export class WorldGenerator extends GameComponent {
  constructor(game) {
    super(game);
    this.init();
    this.baseTerrain = new OctaveNoise(
      this.gcnf.seed, "base-terrain", this.gcnf.baseTerrain, n => -n.minValue());
    this.stoneOffset = new OctaveNoise(
      this.gcnf.seed, "stone-offset", this.gcnf.stoneOffset, -3);
    this.treeGetter = new TreePosGetter(this.gcnf.seed, this.wSize[0], this.wSize[2], this.gcnf.nTrees);
  }

  get gcnf() {
    return this.cnf.generation;
  }

  get wSize() {
    return this.gcnf.wSize;
  }

  init() {
    this.w = new World(this.game, [0, 0, 0], this.wSize);
    this.landHeights = rangeList(this.wSize[0])
      .map(_ => new Array(this.wSize[2]));
  }

  generate() {
    return this.gcnf.isTestWorld ?
      this.generateTestWorld()
      : this.generateTerrain();
  }

  generateTerrain() {
    for (let x = 0; x < this.wSize[0]; x++) {
      for (let z = 0; z < this.wSize[2]; z++) {
        this.generateBlock(x, z);
      }
    }
    progress.addPercent(3);
    this.generateTrees();
    return this.w;
  }

  generateTrees() {
    let positions = this.treeGetter.makeTrees();
    progress.addPercent(3);
    for(let [tx, tz] of positions) {
      this.placeTree(tx, tz);
      progress.addPercent(2/positions.length);
    }
  }

  placeTree(x, z) {
    const setRelOr = (pos, block) => {
      let p = vec3.add([], [x, terrainY, z], pos);
      return this.w.setBlockOr(p, block);
    }
    const getRelOr = (pos) => {
      let p = vec3.add([], [x, terrainY, z], pos);
      return this.w.getBlockOr(p, Blocks.air);
    }
    let terrainY = this.landHeights[x][z];
    for(let yo=3;yo<=5;yo++){
      let r = yo==5 ? 1 : 2;
      for(let xo=-r;xo<=r;xo++) {
        for(let zo=-r;zo<=r;zo++) {
          if(getRelOr([xo, yo, zo]) == Blocks.air){
            setRelOr([xo, yo, zo], Blocks.oak_leaves);
          }
        }
      }
    }
    for(let offset=1;offset<=4;offset++){
      setRelOr([0, offset, 0], Blocks.oak_log);
    }
  }

  generateBlock(x, z) {
    let y = this.getHeightAt(x, z);
    if (y < 0 || y >= this.wSize[1]) {
      console.warn("Noise value outside of world. Consider tweaking nMedian or nScale");
    }
    this.landHeights[x][z] = y;
    let stoneOffset = this.stoneOffset.noise2D(x, z);
    let stoneBelow = y + stoneOffset;
    this.w.setBlockOr([x, y, z], Blocks.grass);
    while (y-->0) {
      this.w.setBlockOr([x, y, z], y <= stoneBelow ? Blocks.stone : Blocks.dirt);
    }
  }

  getHeightAt(x, z) {
    return Math.round(this.baseTerrain.noise2D(x, z));
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

function _mash(v, bits) {
  var rpt = 1 << bits;
  var r = (12345678.91011 * v + 12345.6789 * v * v - 123.456789 - 1234.56789 * v * v * v + Math.cos(12.345 * v - 1.23 * v * v + 3.14) - Math.pow((v + 3.1415) * Math.cos((v + 1.23) * (v - 2.718)), 7) * 27.18 + Math.sin((v + 1.23) * (v - 3.14159) * v - 1234)) % rpt
  return Math.floor(r > 0 ? r : r + rpt)
}
