import { Renderer } from './renderer/renderer.js';
import { getConfig } from './config.js';
import { KeyInput } from './keyinput.js';
import { Player } from './player.js';
import { WorldGenerator } from './world.js';

/**
 * @typedef {import('./config.js').ConfigT} ConfigT
*/

/**
 * The global Game object
*/
export class Game {
  constructor(cnf) {
    this.cnf_arg = cnf;
    this.onInit = null;
    this.startTicks = false;
    this.progress = window.progress;
  }

  async init() {
    if (this.onInit == null) {
      this.onInit = this._init();
      return await this.onInit;
    } else {
      return this.onInit;
    }
  }

  async _init() {
    /** @type {ConfigT} */
    this.cnf = await getConfig(this.cnf_arg);
    progress.addPercent(25);
    this.canvas = document.getElementById('glCanvas');
    this.r = this.renderer = new Renderer(this);
    this.ki = this.keyinput = new KeyInput();
    this.player = new Player(this);
    this.w = this.world = new WorldGenerator(this).generate();
    await this.loadResources();
  }

  get gl() {
    return this.r.gl;
  }

  async loadResources() {
    this.makeResourceLoaders();
    return await this.gatherResourceLoaders();
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
    return this.onReady;
  }

  async start() {
    await this.init();
    this.addAllListeners();
    this.registerOnFrame();
    progress.addPercent(5);
    this.endLoading();
  }

  endLoading(){
    progress.setPercent(100);
    document.querySelectorAll(".overlay").forEach(elem => {
      elem.classList.add("fade-out");
      setTimeout(() => {
        elem.classList.add("click-thru");
      }, 201);
      setTimeout(() => {
        this.startTicks = true;
        elem.hidden=true;
      }, 1001);
    });
    this.canvas.hidden = false;
    document.getElementById("canvas-loading-bg").hidden = true;
  }

  main() {
    this.start();
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
    if(this.startTicks){
      this.tick();
    }
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
