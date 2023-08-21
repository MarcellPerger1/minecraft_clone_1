import { GameComponent } from "./game_component.js";
import { roundNearest } from "./utils/math.js";

export class DynInfo extends GameComponent {
  constructor(game) {
    super(game);
    /** @type {number?} */
    this.lastUpdateAt = null;
  }

  update() {
    if(this.lastUpdateAt != null && performance.now() < this.lastUpdateAt + 1/30) return;
    this.lastUpdateAt = performance.now();
    this.updatePosInfo();
    this.updateFacingInfo();
    this.updateFps();
  }

  updatePosInfo() {
    const coordStr = (p) => p.toFixed(4);
    let coordTextBody = ["x", "y", "z"]
      .map((s, i) => `${s}=${coordStr(this.player.position[i])}`)
      .join(", ");
    this.setText(document.getElementById("pos-info"), coordTextBody);
  }

  updateFacingInfo() {
    let rotSnapped = roundNearest(this.player.rotation.h, 90) % 360;
    this.setText(
      document.getElementById("facing-info"),
      DIR_TO_FACING[rotSnapped]
    );
  }

  updateFps() {
    const fps = 1 / this.game.deltaT;
    this.setText(document.getElementById("fps-info"), fps.toFixed(2));
    this.setText(
      document.getElementById("frame-time-info"),
      this.game.lastFrameTook.toFixed(2) + "ms"
    );
  }

  setText(elem, text) {
    if (elem.innerText !== text) {
      elem.innerText = text;
    }
  }
}

const DIR_TO_FACING = {
  0: "+X",
  90: "+Z",
  180: "-X",
  270: "-Z",
};
