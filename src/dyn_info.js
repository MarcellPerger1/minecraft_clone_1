import { GameComponent } from "./game_component.js";
import { roundNearest } from "./utils/index.js";


export class DynInfo extends GameComponent {
  update() {
    this.updatePosInfo();
    this.updateFacingInfo();
  }

  updatePosInfo() {
    const coordStr = p => p.toFixed(4);
    let coordTextBody = ["x", "y", "z"]
        .map((s, i) => `${s}=${coordStr(this.player.position[i])}`)
        .join(', ');
    this.setText(document.getElementById("pos-info"), coordTextBody);
  }

  updateFacingInfo() {
    let rotSnapped = roundNearest(this.player.rotation.h, 90) % 360;
    this.setText(document.getElementById("facing-info"), DIR_TO_FACING[rotSnapped]);
  }

  setText(elem, text) {
    if(elem.innerText !== text) {
      elem.innerText = text;
    }
  }
}

const DIR_TO_FACING = {
  "0": "+X",
  "90": "+Z",
  "180": "-X",
  "270": "-Z"
}
