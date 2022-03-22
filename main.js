import {Renderer} from './renderer/renderer.js';
import {moveCamera} from './controller.js';

const SPEED = 0.7;
const SENSITIVITY = 0.6;

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
}


function clamp(v, min, max) {
  return v<min ? min : (v>max ? max : v);
}


function pointer_move(r, e){
  //console.log('pointermove', e.movementX, e.movementY);
  if(document.pointerLockElement!=null){
    r.camRot.h += e.movementX * SENSITIVITY;
    // FIX: h rot at low angles not applied correctly!!
    r.camRot.v += e.movementY * SENSITIVITY;
    r.camRot.v = clamp(r.camRot.v, -85, 85);
  }
}

function pointerlock_change(r, e){
  console.log('pointerlock change, new: ',document.pointerLockElement);
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
  let r = window.renderer = new Renderer();
  r.start();
  addEvent('keydown', keydown_handler)
  var c = window.canvas = document.getElementById('glCanvas');
  document.addEventListener('pointerlockerror', e => alert('pointerlock error'));
  addEvent('pointerlockchange', pointerlock_change);
  c.addEventListener('click', e=>{
    console.log(c.requestPointerLock());
    c.addEventListener('pointermove', e => pointer_move(r, e));
  })
  
});
