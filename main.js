import {Renderer} from './renderer/renderer.js';
import {moveCamera} from './controller.js';
import {KeyInput, KeyEvent} from './keyinput.js';
import {clamp} from './utils.module.js';

const SPEED = 3.5;
const SENSITIVITY = 0.6;

// TODO: 16x16 textures - smaller and dont need extra detail
// TODO texture atlas with these!
function keydown_handler(r, e){  
  // if(e.key == 'q'){
  //   r.camPos[1] -= 1;
  // }
  if(e.key == 'z'){
    r.camPos[1] += 1;
  }
}





function clampRot(r){
  r.camRot.v = clamp(r.camRot.v, -80, 80);
  r.camRot.h %= 360;
}


function pointer_move(r, e){
  if(document.pointerLockElement!=null){
    r.camRot.h += e.movementX * SENSITIVITY;
    r.camRot.v += e.movementY * SENSITIVITY;
  }
  clampRot(r);
}

function pointerlock_change(r, e){
  console.log('pointerlock change to ',document.pointerLockElement);
}
function pointerlock_error(r,e){
  alert('pointerlock error');
}

function addEvent(name, hdlr, elem=null, opts=null){
  return (elem??window).addEventListener(
    name,
    e => hdlr(window.renderer, e),
    opts);
}

function addMoveEvent(key, amount){
  var r = window.renderer;
  let ki = window.keyinput;
  return ki.addFunc(new KeyEvent(key),
             (deltaT) => moveCamera(r.camPos,amount,-r.camRot.h,SPEED*deltaT));
}

addEventListener('load', function(){
  var c = window.canvas = document.getElementById('glCanvas');
  var r = window.renderer = new Renderer();
  var ki = window.keyinput = r.ki;
  addMoveEvent('w', [0,0,1]);
  addMoveEvent('s', [0,0,-1]);
  addMoveEvent('a', [-1,0,0]);
  addMoveEvent('d', [1,0,0]);
  addMoveEvent('q', [0,-1,0]);
  addMoveEvent('z', [0,1,0]);
  addEventListener('keydown', (e) => ki.keydown(e));
  addEventListener('keyup', (e) => ki.keyup(e));
  r.start();
  addEvent('keydown', keydown_handler);
  addEvent('pointerlockerror', pointerlock_error, document);
  addEvent('pointerlockchange', pointerlock_change, document);
  c.addEventListener('click', e=>{
    c.requestPointerLock();
    c.addEventListener('pointermove', e => pointer_move(r, e));
  })
  
});
