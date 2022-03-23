import {Renderer} from './renderer/renderer.js';
import {moveCamera} from './controller.js';

const SPEED = 0.7;
const SENSITIVITY = 0.6;

// TODO: 16x16 textures - smaller and dont need extra detail
// TODO texture atlas with these!
function keydown_handler(r, e){  
  if(e.key == 'w' || e.key=='ArrowUp'){
    moveCamera(r.camPos,[0,0,1],-r.camRot.h,SPEED);
  }
  if(e.key == 's' || e.key=='ArrowDown'){
    moveCamera(r.camPos,[0,0,-1],-r.camRot.h,SPEED);
  }
  if(e.key == 'a'){
    moveCamera(r.camPos,[1,0,0],-r.camRot.h,SPEED);
  }
  if(e.key == 'd'){
    moveCamera(r.camPos,[-1,0,0],-r.camRot.h,SPEED);
  }
  if(e.key == 'q'){
    r.camPos[1] -= 1;
  }
  if(e.key == 'z'){
    r.camPos[1] += 1;
  }
  if(e.key=='ArrowRight'){
    r.camRot.h += 5;
  }
  if(e.key=='ArrowLeft'){
    r.camRot.h -= 5;
  }
  console.log(e.key, e.code)
  clampRot(r);
}


function clamp(v, min, max) {
  return v<min ? min : (v>max ? max : v);
}


function clampRot(r){
  r.camRot.v = clamp(r.camRot.v, -80, 80);
  r.camRot.h %= 360;
}


function pointer_move(r, e){
  //console.log('pointermove', e.movementX, e.movementY);
  if(document.pointerLockElement!=null){
    r.camRot.h += e.movementX * SENSITIVITY;
    // FIX: h rot at low angles not applied correctly!!
    r.camRot.v += e.movementY * SENSITIVITY;
  }
  clampRot(r);
}

function pointerlock_change(r, e){
  console.log('pointerlock change, new: ',document.pointerLockElement);
}
function pointerlock_error(r,e){
  alert('pointerlock error');
}

function click_handler(r, e){
  
}

function addEvent(name, hdlr, elem=null, opts=null){
  return (elem??window).addEventListener(
    name,
    e => hdlr(window.renderer, e),
    opts);
}

addEventListener('load', function(){
  var c = window.canvas = document.getElementById('glCanvas');
  var r = window.renderer = new Renderer();
  r.start();
  addEvent('keydown', keydown_handler);
  addEvent('pointerlockerror', pointerlock_error, document);
  addEvent('pointerlockchange', pointerlock_change, document);
  c.addEventListener('click', e=>{
    c.requestPointerLock();
    c.addEventListener('pointermove', e => pointer_move(r, e));
  })
  
});
