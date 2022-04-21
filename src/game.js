import { Renderer } from './renderer/renderer.js';
import { Config } from './config.js';
import { KeyInput } from './keyinput.js';
import { Player } from './player.js';
import { World, Blocks, WorldGenerator } from './world.js';

/**
 * The global Game object
*/
export class Game {
  constructor(cnf) {
    this.cnf = new Config(cnf);
    this.canvas = document.getElementById('glCanvas');
    this.r = this.renderer = new Renderer(this);
    this.ki = this.keyinput = new KeyInput();
    this.player = new Player(this);
    this.w = this.world = new WorldGenerator(this).generate();//new World(this, [0, 0, 0]);
    // for (let x = 0; x < 8; x++) {
    //   for (let z = 0; z < 8; z++) {
    //     this.world.setBlock([x, 0, z], Blocks[(x+z+1)%5]);
    //   }
    // }
    // this.world.setBlock([15, 0, 0], Blocks.grass);
    // this.world.setBlock([0, 0, 15], Blocks.grass);
    // this.world.setBlock([0, 3, 0], Blocks.grass);
    this.loadResources();
  }

  get gl() {
    return this.r.gl;
  }

  loadResources() {
    this.makeResourceLoaders();
    this.gatherResourceLoaders();
    return this.onReady;
  }

  makeResourceLoaders() {
    this.resourceLoaders = [this.r];
  }

  gatherResourceLoaders() {
    this.loadProms = this.resourceLoaders.map(o => {
      let f = o?.loadResources;
      if (f == null) { return Promise.resolve(); }
      return o.loadResources();
    });
    this.onReady = Promise.all(this.loadProms);
  }

  start() {
    this.onReady.then(_result => {
      this.addAllListeners();
      this.registerOnFrame();
    })
  }

  onload() {
    this.start();
  }

  main() {
    this.onload();
  }

  render(now = null) {
    if (now == null) {
      return this.registerOnFrame();
    }
    this.now = now * 0.001;
    this.then ??= this.now;
    this.deltaT = this.now - this.then;
    this.onframe();
    this.then = this.now;
    return this.registerOnFrame();
  }

  onframe() {
    this.tick();
    this.r.renderFrame();
  }

  tick() {
    this.ki.tick(this.deltaT);
    this.player.tick();
  }

  registerOnFrame() {
    let this_outer = this;
    return requestAnimationFrame(now => { this_outer.render(now); });
  }

  pointerlock_change(_e) {
    console.log('pointerlock change to ', document.pointerLockElement);
  }
  pointerlock_error(_e) {
    console.log('pointerlock error');
  }

  addEvent(name, hdlr, thisArg = null, elem = null, opts = null) {
    elem ??= window;
    return elem.addEventListener(
      name, event => hdlr.call(thisArg, event), opts);
  }

  addPointerEvents() {
    this.addEvent('pointerlockerror', this.pointerlock_error, this, document);
    this.addEvent('pointerlockchange', this.pointerlock_change, this, document);
    this.canvas.addEventListener(
      'click', _e => {
        if (!this.pointerLocked) {
          this.canvas.requestPointerLock();
        }
      });
  }

  addAllListeners() {
    this.addPointerEvents();
    this.player.addListeners();
    this.ki.addListeners();
  }

  hasPointerLock() {
    return document.pointerLockElement === this.canvas;
  }

  get pointerLocked() {
    return this.hasPointerLock();
  }
}
