import { GameComponent } from "../game_component.js";
import { SeedFork } from "./seed.js"

export class BaseGenerator extends GameComponent {
  constructor(game) {
    super(game);
  }

  get gcnf() {
    return this.cnf.generation;
  }

  get wSize() {
    return this.gcnf.wSize;
  }

  get globSeed() {
    return this.gcnf.seed;
  }

  getSeed(name, i=null) {
    return SeedFork.getSeed(this.globSeed, name, i ?? 0);
  }

  getSeeds(name, n) {
    return SeedFork.getSeeds(this.globSeed, name, n);
  }
}