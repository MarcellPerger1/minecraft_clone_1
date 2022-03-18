import {Renderer} from './renderer/renderer.js';
import {moveCamera} from './controller.js';

const SPEED = 0.7;

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


addEventListener('load', function(){
  let r = window.renderer = new Renderer();
  r.start();
  addEventListener('keydown', e => {keydown_handler(r, e);});
});
