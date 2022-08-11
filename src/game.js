import { Renderer } from './renderer/renderer.js';
import { getConfig } from './config.js';
import { KeyInput } from './keyinput.js';
import { Player } from './player.js';
import { WorldGenerator } from './world.js';
import { roundNearest } from './utils.js';
import { LoadingEndMgr } from './loading_end.js';


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
    this.frameNo = -1;
    this.tickNo  = -1;
  }

  async init() {
    return (this.onInit ??= this._init());
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

  async loadResources() {
    this.makeResourceLoaders();
    return await this.joinResourceLoaders();
  }

  makeResourceLoaders() {
    this.resourceLoaders = [this.r];
  }

  joinResourceLoaders() {
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
    this.ls = new LoadingEndMgr(this);
    this.ls.endLoading();
    this.ls.start.then(() => {
      this.startTicks = true;
    })
  }

  main() {
    this.start();
  }

  frameCallback(now = null) {
    if (now == null) {
      return this.registerOnFrame();
    }
    this.frameNo++;
    this.now = now * 0.001;
    if(this.then==null) {
      this.then = this.now;
    }
    this.deltaT = this.now - this.then;
    this.onframe();
    this.then = this.now;
    return this.registerOnFrame();
  }

  registerOnFrame() {
    return requestAnimationFrame(this.frameCallback.bind(this));
  }

  onframe() {
    // unconditional re-render on first frame and every 120th frame
    this.rerender ||= this.frameNo % 120 == 0;
    if(this.startTicks){
      this.tickCallback();
    }
    this.render();
    this.updateDynInfo();
  }

  render() {
    let remakeMesh = this.rerender;
    this.rerender = false;
    this.r.renderFrame(remakeMesh);
  }

  tickCallback() {
    this.tickNo++;
    this.tick();
  }

  tick() {
    this.ki.tick(this.deltaT);
    this.player.tick();
    // rerender on first tick
    this.rerender ||= this.tickNo==0;
  }

  updateDynInfo(){
    this.updateFacingInfo();
    this.updatePosInfo();
  }

  updatePosInfo() {
    const coordStr = p => p.toFixed(4);
    let coordTextBody = ["x", "y", "z"]
        .map((s, i) => `${s}=${coordStr(this.player.position[i])}`)
        .join(', ');
    document.getElementById("pos-info").innerText = coordTextBody;
  }

  updateFacingInfo() {
    let rotSnapped = roundNearest(this.player.rotation.h, 90) % 360;
    document.getElementById("facing-info").innerText = DIR_TO_FACING[rotSnapped];
  }

  pointerlock_change(_e) {
    console.log('pointerlock change to ', document.pointerLockElement);
  }

  addPointerEvents() {
    document.addEventListener('pointerlockchange', this.pointerlock_change.bind(this));
    this.canvas.addEventListener('click', _e => {
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

const DIR_TO_FACING = {
  "0": "+X",
  "90": "+Z",
  "180": "-X",
  "270": "-Z"
}
