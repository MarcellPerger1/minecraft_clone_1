function keypress_handler(r, e){  
  if(e.key == 'w'){
    r.camPos[2] += 1;
  }
  if(e.key == 's'){
    r.camPos[2] -= 1;
  }
  if(e.key == 'a'){
    r.camPos[0] += 1;
  }
  if(e.key == 'd'){
    r.camPos[0] -= 1;
  }
  if(e.key == 'q'){
    r.camPos[1] -= 1;
  }
  if(e.key == 'z'){
    r.camPos[1] += 1;
  }
}


addEventListener('load', function(){
  window.renderer = new Renderer({rotate: true});
  let r = renderer;
  r.start();
  addEventListener('keydown', e => {keypress_handler(r, e);});
});
