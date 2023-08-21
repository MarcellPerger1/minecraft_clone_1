import { GameComponent } from "./game_component.js";
import { KeyEvent, button } from "./keyinput.js";
import { faceToOffsetInfo } from "./renderer/renderer.js";
import { clamp, toRad } from "./utils/math.js";
import { Blocks } from "./world.js";

// TODO: where should this go
/**
 * @param {[number, number, number]} pos
 * @param {import("./renderer/renderer.js").OffsetInfoT} offsetInfo
 * @returns {[number, number, number]}
 */
export function posFromOffset(pos, offsetInfo) {
  pos = [...pos]; // copy it
  const [axis, sign] = offsetInfo;
  pos[axis] += sign;
  return pos;
}

export class Player extends GameComponent {
  constructor(game) {
    super(game);
    this.rotation = Object.assign({}, this.cnf.player.startRot);
    this.position = this.cnf.player.startPos.slice();
    this.blockInHand = Blocks.oak_log;
  }

  addListeners() {
    this.addMoveBindings();
    this.canvas.addEventListener("pointermove", this.pointer_move.bind(this));
    this.canvas.addEventListener("pointerdown", (event) => {
      if (!this.game.pointerLocked) return;
      switch (event.button) {
        case button.LEFT:
          this.action_breakBlock();
          break;
        case button.RIGHT:
          this.action_placeBlock();
          break;
      }
    });
  }

  action_breakBlock() {
    const clickInfo = this.pickingRenderer.readCanvasCenter();
    if (clickInfo == null) return;
    const pos = clickInfo[0];
    this.world.setBlock(pos, Blocks.air);
    this.renderMgr.invalidateBlockAndAdjacent(pos);
  }

  action_placeBlock() {
    const clickInfo = this.pickingRenderer.readCanvasCenter();
    if (clickInfo == null) return;
    const [clickedPos, face] = clickInfo;
    const offset = faceToOffsetInfo(face);
    const pos = posFromOffset(clickedPos, offset);
    if (!this.world.inRange(pos)) return;
    if (this.world.getBlock(pos) != Blocks.air) {
      console.warn(
        "Trying to place block where there isn't air " +
          "(are you placing it from inside the terrain"
      );
      return;
    }
    this.world.setBlock(pos, this.blockInHand);
    this.renderMgr.invalidateBlockAndAdjacent(pos);
  }

  pointer_move(e) {
    if (this.game.hasPointerLock()) {
      this.rotation.h +=
        this.clampMouseMovementPart(e, 0) * this.cnf.controls.sensitivity;
      this.rotation.v +=
        this.clampMouseMovementPart(e, 1) * this.cnf.controls.sensitivity;
    }
    this.clampRot();
  }

  /**
   * Returns a part (x or y) of the mouse movement (from event `e`)
   * clamped to the values set in `game.cnf`
   * @param {MouseEvent} e - The event to get values from
   * @param {number} part - Which part of the movement (0=x, 1=y)
   * @returns {number} the clamped value
   */
  clampMouseMovementPart(e, part) {
    return clamp(
      this.getMouseMovementPart(e, part),
      -this.cnf.controls.maxMouseMove[part],
      this.cnf.controls.maxMouseMove[part]
    );
  }

  /**
   * Returns a part (x or y) of the mouse movement (from event `e`)
   * (not clamped)
   * @param {MouseEvent} e - The event to get values from
   * @param {number} part - Which part of the movement (0=x, 1=y)
   * @returns {number} the clamped value
   */
  getMouseMovementPart(e, part) {
    return part == 0 ? e.movementX : e.movementY;
  }
  static getMouseMovementPart(e, part) {
    return this.prototype.getMouseMovementPart(e, part);
  }

  clampRot() {
    this.rotation.v = clamp(this.rotation.v, ...this.cnf.controls.vRotRange);
    this.rotation.h %= 360;
    this.rotation.h =
      this.rotation.h >= 0 ? this.rotation.h : this.rotation.h + 360;
  }

  tick() {
    this.apply_h_movement();
  }

  apply_h_movement() {
    let movement = [0, 0, 0];
    if (this.ki.pressed("w")) {
      movement[2] += 1;
    }
    if (this.ki.pressed("s")) {
      movement[2] -= 1;
    }
    if (this.ki.pressed("a")) {
      movement[0] += 1;
    }
    if (this.ki.pressed("d")) {
      movement[0] -= 1;
    }
    vec3.normalize(movement, movement);
    this.moveRelRotation(movement, this.cnf.player.speed * this.deltaT);
  }

  addMoveBindings() {
    this.addMoveEvent("q", [0, 1, 0]);
    this.addMoveEvent("z", [0, -1, 0]);
  }

  addMoveEvent(key, amount) {
    return this.ki.addFunc(new KeyEvent(key), (deltaT) => {
      this.moveRelRotation(amount, this.cnf.player.speed * deltaT);
    });
  }

  moveRelRotation(moveBy, scale = 1) {
    let scaled = vec3.scale([], moveBy, scale);
    let absMove = vec3.rotateY(
      [],
      scaled,
      [0, 0, 0],
      toRad(-this.rotation.h + 90)
    );
    vec3.add(this.position, this.position, absMove);
  }
}

export function moveCamera(camPos, moveBy, hCamRotDeg, scale = 1) {
  let scaled = vec3.scale([], moveBy, scale);
  let absMove = vec3.rotateY([], scaled, [0, 0, 0], toRad(hCamRotDeg));
  vec3.add(camPos, camPos, absMove);
}
