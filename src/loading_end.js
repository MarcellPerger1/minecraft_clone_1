import { GameComponent } from "./game_component.js";

export class LoadingEndMgr extends GameComponent {
  endLoading() {
    this.onLoadEnd();
    this.earlyStart = this.promiseHook();
    setTimeout(() => this.onEarlyStart(), 201);
    this.start = this.promiseHook();
    setTimeout(() => this.onStart(), 1001);
  }

  /**
   * @template T
   * @returns {Promise<T> & {res: (value: T) => void, rej: (reason?: any) => void}}
   */
  promiseHook() {
    let o = { res: null, rej: null };
    let p = new Promise((res, rej) => {
      o.res = res;
      o.rej = rej;
    });
    Object.assign(p, o);
    return p;
  }

  onLoadEnd() {
    this.overlayElems.forEach((elem) => {
      elem.classList.add("fade-out");
    });
    this.showTrueCanvas();
  }

  showTrueCanvas() {
    this.canvas.hidden = false;
    document.getElementById("canvas-loading-bg").hidden = true;
  }

  onEarlyStart() {
    this.overlayElems.forEach((elem) => {
      elem.classList.add("click-thru");
    });
    document.getElementById("dyn-info").hidden = false;
    this.earlyStart.res();
  }

  onStart() {
    this.overlayElems.forEach((elem) => {
      elem.hidden = true;
    });
    this.start.res();
  }

  get overlayElems() {
    return document.querySelectorAll(".overlay");
  }
}
