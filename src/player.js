import {GameComponent} from './game_component.js';
import {KeyEvent} from './keyinput.js';
import {clamp, toRad} from './utils.js';


export class Player extends GameComponent {
  constructor(game){
    super(game);
    this.rotation = {h: 0, v: 0};
    this.position = this.cnf.camPos.slice(); // todo rename config entry
  }

  addListeners(){
    this.addMoveBindings();
    this.addEvent('pointermove', this.pointer_move, this, this.canvas);
  }

  pointer_move(e){
    if(this.game.hasPointerLock()){
      this.rotation.h += e.movementX * this.cnf.sensitivity;
      this.rotation.v += e.movementY * this.cnf.sensitivity;
    }
    this.clampRot();
  }

  clampRot(){
    this.rotation.v = clamp(this.rotation.v, this.cnf.vRotMin, this.cnf.vRotMax);
    this.rotation.h %= 360;
  }

  tick(){
    this.apply_h_movement();
  }

  apply_h_movement(){
    let movement = [0, 0, 0];
    if(this.ki.pressed('w')){
      movement[2] += 1;
    } 
    if(this.ki.pressed('s')){
      movement[2] -= 1;
    }
    if(this.ki.pressed('a')){
      movement[0] += 1;
    }
    if(this.ki.pressed('d')){
      movement[0] -= 1;
    }
    vec3.normalize(movement, movement);
    this.moveRelRotation(movement, this.cnf.speed * this.deltaT);
  }

  addMoveBindings(){
    this.addMoveEvent('q', [0,-1,0]);
    this.addMoveEvent('z', [0,1,0]);
  }

  addMoveEvent(key, amount){
    return this.ki.addFunc(
      new KeyEvent(key),
      (deltaT) => {
        this.moveRelRotation(amount, this.cnf.speed * deltaT)
      }
    );
  }

  moveRelRotation(moveBy, scale=1) {
    let scaled = vec3.scale([], moveBy, scale);
    let absMove = vec3.rotateY([], scaled, [0,0,0], toRad(-this.r.camRot.h));
    vec3.add(this.position, this.position, absMove);
  }
}


export function moveCamera(camPos, moveBy, hCamRotDeg, scale=1) {
  let scaled = vec3.scale([], moveBy, scale);
  let absMove = vec3.rotateY([], scaled, [0,0,0], toRad(hCamRotDeg));
  vec3.add(camPos, camPos, absMove);
}
