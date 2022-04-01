import {GameComponent} from './game_component.js';
import {moveCamera} from './controller.js';
import {KeyEvent} from './keyinput.js';


export class Player extends GameComponent {
  constructor(game){
    super(game);
    this.rotation = {h: 0, v: 0};
  }

  addListeners(){
    this.addMoveBindings();
    this.addEvent('pointermove', this.pointer_move, this, this.canvas);
  }

  addEvent(name, hdlr, thisArg=null, elem=null, opts=null){
    elem ??= window;
    return elem.addEventListener(
      name, event => hdlr.call(thisArg, event), opts);
  }

  pointer_move(e){
    console.log('point move player')
    if(document.pointerLockElement === this.canvas){
      this.rotation.h += e.movementX * this.cnf.sensitivity;
      this.rotation.v += e.movementY * this.cnf.sensitivity;
      this.r.camRot.h = this.rotation.h;
      this.r.camRot.v = this.rotation.v;
    }
    this.game.clampRot();
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
