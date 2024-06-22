import { RenderMgr } from "./renderer/renderer.js";
import { getConfig } from "./ts/config.js";
import { KeyInput } from "./keyinput.js";
import { Player } from "./player.js";
import { WorldGenerator } from "./world.js";
import { LoadingEndMgr } from "./loading_end.js";
import { DynInfo } from "./dyn_info.js";
import { currentVersionLoader } from "./current_version_loader.js";
import { BlockToPlace } from "./ts/block_to_place.js";

/**
 * @typedef {import('./ts/config.js').ConfigT} ConfigT
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
    this.lastFrameTook = 0;
    this.frameNo = -1;
    this.tickNo = -1;
  }

  async init() {
    return (this.onInit ??= this._init());
  }

  async _init() {
    this.cnf = await getConfig(this.cnf_arg);
    progress.addPercent(25);
    this.canvas = /** @type {HTMLCanvasElement} */(document.getElementById("glCanvas"));
    this.styleSheet = /** @type {HTMLLinkElement} */(document.getElementById("main-stylesheet")).sheet;
    this.setCanvasSize();
    this.renderMgr = new RenderMgr(this);
    this.ki = this.keyinput = new KeyInput();
    this.player = new Player(this);
    this.w = this.world = new WorldGenerator(this).generate();
    this.info = new DynInfo(this);
    this.blockToPlaceHandler = new BlockToPlace(this.player).loadBlocks();
    await this.loadResources();
  }

  /**
   * Returns all style rules that match a selector
   * @param {string} target - the selector
   * @param {boolean} [exact=true] - if false, only require containment, not equality
   * @returns {CSSStyleRule[]}
   */
  getStyleBySelectorAll(target, exact = true) {
    target = target.trim();
    let fullMatch = Array.from(this.styleSheet.cssRules).filter((rule) => {
      if (!(rule instanceof CSSStyleRule)) {
        return false;
      }
      let selector = rule.selectorText;
      if (!selector) {
        return false;
      }
      selector = selector.trim();
      return exact ? selector === target : selector.includes(target);
    });
    return fullMatch;
  }

  /**
   * Returns the first style rule that matches a selector
   * @param {string} target - the selector
   * @param {boolean} [exact=true] - if false, only require containment, not equality
   * @returns {CSSStyleRule}
   */
  getStyleBySelector(target, exact = true) {
    return this.getStyleBySelectorAll(target, exact)[0];
  }

  setCanvasSize() {
    this.canvas.width = this.cnf.canvasSize[0];
    this.canvas.height = this.cnf.canvasSize[1];
    this.cssVars = this.getStyleBySelector(":root").style;
    this.cssVars.setProperty(
      "--canvas-width",
      this.cnf.canvasSize[0].toString() + "px"
    );
    this.cssVars.setProperty(
      "--canvas-height",
      this.cnf.canvasSize[1].toString() + "px"
    );
  }

  async loadResources() {
    this.makeResourceLoaders();
    return await this.joinResourceLoaders();
  }

  makeResourceLoaders() {
    /**
     * @type {Array<{loadResources: () => void}>}
     */
    this.resourceLoaders = [this.renderMgr, currentVersionLoader];
  }

  joinResourceLoaders() {
    this.loadProms = this.resourceLoaders.map((o) => {
      let f = o?.loadResources;
      if (f == null) {
        return;
      }
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

  endLoading() {
    progress.setPercent(100);
    this.ls = new LoadingEndMgr(this);
    this.ls.endLoading();
    this.ls.start.then(() => {
      this.startTicks = true;
    });
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
    if (this.then == null) {
      this.then = this.now;
    }
    this.deltaT = this.now - this.then;
    this.frameStartAt = performance.now();
    this.onframe();
    this.frameEndAt = performance.now();
    this.lastFrameTook = this.frameEndAt - this.frameStartAt;
    this.then = this.now;
    return this.registerOnFrame();
  }

  registerOnFrame() {
    return requestAnimationFrame(this.frameCallback.bind(this));
  }

  onframe() {
    if (this.startTicks) {
      this.tickCallback();
    }
    this.render();
    this.info.update();
  }

  render() {
    this.renderMgr.renderFrame();
  }

  tickCallback() {
    this.tickNo++;
    this.tick();
  }

  tick() {
    this.ki.tick(this.deltaT);
    this.player.tick();
  }

  pointerlock_change() {
    console.log("pointerlock change to ", document.pointerLockElement);
  }

  addPointerEvents() {
    document.addEventListener(
      "pointerlockchange",
      this.pointerlock_change.bind(this)
    );
    this.canvas.addEventListener("click", (_e) => {
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
