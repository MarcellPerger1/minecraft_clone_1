import {GameComponent} from './game_component.js';
import {moveCamera} from './controller.js';
import {KeyEvent} from './keyinput.js';
import {clamp} from './utils.js';


export class Player extends GameComponent {
  constructor(game){
    super(game);
    this.rotation = {h: 0, v: 0};
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
    this.r.camRot.h = this.rotation.h;
    this.r.camRot.v = this.rotation.v;
  }

  clampRot(){
    this.rotation.v = clamp(this.rotation.v, this.cnf.vRotMin, this.cnf.vRotMax);
    this.rotation.h %= 360;
  }

  addMoveBindings(){
    this.addMoveEvent('w', [0,0,1]);
    this.addMoveEvent('s', [0,0,-1]);
    this.addMoveEvent('a', [1,0,0]);
    this.addMoveEvent('d', [-1,0,0]);
    this.addMoveEvent('q', [0,-1,0]);
    this.addMoveEvent('z', [0,1,0]);
  }

  addMoveEvent(key, amount){
    return this.ki.addFunc(
      new KeyEvent(key),
      (deltaT) => {
        moveCamera(
          this.r.camPos, amount,
          -this.r.camRot.h, this.cnf.speed * deltaT);
      }
    );
  }
}
