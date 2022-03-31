import {Renderer} from './renderer/renderer.js';
import {Config} from './config.js';
import {moveCamera} from './controller.js';
import {KeyEvent} from './keyinput.js';
import {clamp} from './utils.js';

export class Game {
  constructor(cnf){
    this.cnf = new Config(cnf);
    this.canvas = document.getElementById('glCanvas');
    this.r = this.renderer = new Renderer(this);
    this.ki = this.keyinput = this.r.ki;
  }
  
  clampRot(){
    this.r.camRot.v = clamp(this.r.camRot.v, this.cnf.vRotMin, this.cnf.vRotMax);
    this.r.camRot.h %= 360;
  }

  main(){
    this.onload();
  }

  pointer_move(e){
    if(document.pointerLockElement === this.canvas){
      this.r.camRot.h += e.movementX * this.cnf.sensitivity;
      this.r.camRot.v += e.movementY * this.cnf.sensitivity;
    }
    this.clampRot();
  }

  pointerlock_change(_e){
    console.log('pointerlock change to ', document.pointerLockElement);
  }
  pointerlock_error(_e){
    console.log('pointerlock error');
    throw new Error('pointerlock error');
  }

  addEvent(name, hdlr, thisArg=null, elem=null, opts=null){
    elem ??= window;
    return elem.addEventListener(
      name, event => hdlr.call(thisArg, event), opts);
  }

  addPointerEvents(){
    this.addEvent('pointerlockerror', this.pointerlock_error, this, document);
    this.addEvent('pointerlockchange', this.pointerlock_change, this, document);
    this.addEvent('pointermove', this.pointer_move, this, this.canvas);
    this.canvas.addEventListener(
      'click', _e => { this.canvas.requestPointerLock(); });
  }

  addMoveEvent(key, amount){
    return this.ki.addFunc(
      new KeyEvent(key),
      (deltaT) => moveCamera(
        this.r.camPos, amount,
        -this.r.camRot.h, this.cnf.speed * deltaT)
    );
  }

  addMoveBindings(){
    this.addMoveEvent('w', [0,0,1]);
    this.addMoveEvent('s', [0,0,-1]);
    this.addMoveEvent('a', [1,0,0]);
    this.addMoveEvent('d', [-1,0,0]);
    this.addMoveEvent('q', [0,-1,0]);
    this.addMoveEvent('z', [0,1,0]);
  }

  addAllListeners(){
    this.addMoveBindings();
    this.ki.addListeners();
    this.addPointerEvents();
  }

  onload(){
    this.addAllListeners();
    this.r.start();
  }
}
