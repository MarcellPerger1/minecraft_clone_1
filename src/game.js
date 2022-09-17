import { Renderer } from './renderer/renderer.js';
import { getConfig } from './config.js';
import { KeyInput } from './keyinput.js';
import { Player } from './player.js';
import { WorldGenerator } from './world.js';
import { LoadingEndMgr } from './loading_end.js';
import { DynInfo } from './dyn_info.js';


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
    this.styleSheet = document.getElementById("main-stylesheet").sheet;
    this.setCanvasSize();
    this.r = this.renderer = new Renderer(this);
    this.ki = this.keyinput = new KeyInput();
    this.player = new Player(this);
    this.w = this.world = new WorldGenerator(this).generate();
    this.info = new DynInfo(this);
    await this.loadResources();
  }

  /**
   * Returns a style rule that matches selector
   * @param {string} target - the selector
   * @param {Object} opts - extra options
   * @param {boolean} [opts.exact=true] - if false, only require containment, not equality
   * @param {boolean} [opts.all=false] - Return all matches in a list
   * @returns {CSSStyleRule | CSSStyleRule[]}
   */
  getStyleBySelector(target, opts = null) {
    opts = {exact: true, all: false, ...(opts ?? {})};
    target = target.trim();
    let fullMatch = Array.from(this.styleSheet.cssRules)
      .filter(rule => {
        if(!rule instanceof CSSStyleRule) { return false; }
        let selector = rule.selectorText;
        if(!selector) { return false; }
        selector = selector.trim();
        return opts.exact ? selector === target : selector.includes(target);
      });
    return opts.all ? fullMatch : fullMatch[0];
  }

  setCanvasSize() {
    this.canvas.width = this.cnf.canvasSize[0];
    this.canvas.height = this.cnf.canvasSize[1];
    /** @type {CSSStyleRule} */
    this.rootStyle = this.getStyleBySelector(':root');
    this.rootStyle.style.setProperty(
      "--canvas-width", this.cnf.canvasSize[0].toString() + 'px');
    this.rootStyle.style.setProperty(
      "--canvas-height", this.cnf.canvasSize[1].toString() + 'px');
  }

  async loadResources() {
    this.makeResourceLoaders();
    return await this.joinResourceLoaders();
  }

  makeResourceLoaders() {
    /**
     * @type {Array<{loadResources: () => void}>}
     */
    this.resourceLoaders = [this.r];
  }

  joinResourceLoaders() {
    this.loadProms = this.resourceLoaders.map(o => {
      let f = o?.loadResources;
      if (f == null) { return; }
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
    this.info.update();
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

  pointerlock_change() {
    console.log('pointerlock change to ', document.pointerLockElement);
  }

  addPointerEvents() {
    document.addEventListener(
      'pointerlockchange', this.pointerlock_change.bind(this));
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
