import {Renderer} from './renderer/renderer.js';
import {moveCamera} from './controller.js';
import {KeyEvent} from './keyinput.js';
import {clamp} from './utils.js';

// TODO: 16x16 textures - smaller and dont need extra detail
// TODO texture atlas with these!

function clampRot(r){
  r.camRot.v = clamp(r.camRot.v, window.cnf.vRotMin, window.cnf.vRotMax);
  r.camRot.h %= 360;
}


function pointer_move(r, e){
  if(document.pointerLockElement === window.canvas){
    r.camRot.h += e.movementX * window.cnf.sensitivity;
    r.camRot.v += e.movementY * window.cnf.sensitivity;
  }
  clampRot(r);
}

function pointerlock_change(_r, _e){
  console.log('pointerlock change to ', document.pointerLockElement);
}
function pointerlock_error(_r, _e){
  console.log('pointerlock error');
  throw new Error('pointerlock error');
}

function addEvent(name, hdlr, elem=null, opts=null){
  return (elem??window).addEventListener(
    name,
    e => hdlr(window.renderer, e),
    opts);
}

function addMoveEvent(key, amount){
  var r = window.renderer;
  var ki = window.keyinput;
  return ki.addFunc(
    new KeyEvent(key),
    (deltaT) => moveCamera(
      r.camPos, amount,
      -r.camRot.h, window.cnf.speed*deltaT)
  );
}

function addMoveBindings(){
  addMoveEvent('w', [0,0,1]);
  addMoveEvent('s', [0,0,-1]);
  addMoveEvent('a', [1,0,0]);
  addMoveEvent('d', [-1,0,0]);
  addMoveEvent('q', [0,-1,0]);
  addMoveEvent('z', [0,1,0]);
}

function addPointerEvents(){
  var c = window.canvas;
  addEvent('pointerlockerror', pointerlock_error, document);
  addEvent('pointerlockchange', pointerlock_change, document);
  addEvent('pointermove', pointer_move, c);
  c.addEventListener('click', _e=>{ c.requestPointerLock(); });
}

function addAllListeners(){
  var ki = window.keyinput;
  var c = window.canvas;
  addMoveBindings();
  ki.addListeners();
  addPointerEvents();
}

function initGlobs(){
  window.canvas = document.getElementById('glCanvas');
  var r = window.renderer = new Renderer();
  window.keyinput = r.ki;
  window.cnf = r.cnf;
}

addEventListener('load', function(){
  initGlobs();
  var r = window.renderer;
  addAllListeners();
  r.start();
});
