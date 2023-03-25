import { GameComponent } from "./game_component.js";
import { KeyEvent } from "./keyinput.js";
import { clamp, toRad } from "./utils/math.js";

export class Player extends GameComponent {
  constructor(game) {
    super(game);
    this.rotation = Object.assign({}, this.cnf.player.startRot);
    this.position = this.cnf.player.startPos.slice();
  }

  addListeners() {
    this.addMoveBindings();
    this.canvas.addEventListener("pointermove", this.pointer_move.bind(this));
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
      toRad(-this.r.camRot.h + 90)
    );
    vec3.add(this.position, this.position, absMove);
  }
}

export function moveCamera(camPos, moveBy, hCamRotDeg, scale = 1) {
  let scaled = vec3.scale([], moveBy, scale);
  let absMove = vec3.rotateY([], scaled, [0, 0, 0], toRad(hCamRotDeg));
  vec3.add(camPos, camPos, absMove);
}
