import {extendNullSafe} from './utils.module.js';
// TODO: merge 2 utils files
import {isString, expectValue} from './renderer/utils.js';  

export function moveCamera(camPos, moveBy, hCamRotDeg, scale) {
  vec3.add(/*dest*/camPos, camPos,
      vec3.rotateY(
        // dest
        [],
        // rotate this
        vec3.scale([],moveBy,scale),  
        // center of rotation
        [0,0,0],  
        // angle
        hCamRotDeg*Math.PI/180
      )
    );
}


// export class Handlers {
//   constructor(r, h){
//     // {event_name: {handler: [[Function]], element: [[Element]], options: ...}, ...}
//     this.handlers = h;
//     this.r = r;
//   }

//   addListeners(){
//     for(const [name, o] of Object.entries(this.handlers)){
//       if(o==null) { continue; }
//       let handlers = [];
//       if(o.handler==null && o.handlers==null && isFunction(o)){
//         handlers.push(o);
//       } else {
//         extendNullSafe(handlers, [o.handler], o.handlers);
//       }
//       for(let h of handlers){
//         getElement(o.element).addEventListener(
//           name,
//           e => h(e, this.r),
//           o.options ?? o.useCapture);
//       }
//     }
//   }
// }

// function getElement(elem){
//   if(isString(elem)){
//     return expectValue(document.getElementById(elem), 'element (from id)');
//   }
//   return elem ?? window;
// }


// function isFunction(f){
//   return f instanceof Function;
// }

// const f_toStr = Function.prototype.toString.call;

// function isFunctionStrict(f){
//   return isFunction(f) && !f_toStr(f).startsWith('class');
// }


// export function moveEvent(e, r){
//   if(e.key == 'w' || e.key == 'ArrowUp'){
//     moveCamera(r.camPos,[0,0,1],-r.camRot.h,SPEED);
//   }
//   if(e.key == 's' || e.key == 'ArrowDown'){
//     moveCamera(r.camPos,[0,0,-1],-r.camRot.h,SPEED);
//   }
//   if(e.key == 'a'){
//     moveCamera(r.camPos,[1,0,0],-r.camRot.h,SPEED);
//   }
//   if(e.key == 'd'){
//     moveCamera(r.camPos,[-1,0,0],-r.camRot.h,SPEED);
//   }
//   if(e.key == 'q'){
//     r.camPos[1] -= 1;
//   }
//   if(e.key == 'z'){
//     r.camPos[1] += 1;
//   }
//   if(e.key=='ArrowRight'){
//     r.camRot.h += 5;
//   }
//   if(e.key=='ArrowLeft'){
//     r.camRot.h -= 5;
//   }
// }


// export var handlers = {
//   keydown: {
//     handler: moveEvent,
//     element: 'glCanvas' 
//   },
//   pointermove: {
//     handler: function pointermove(e, r){
//       console.log('pointermove', e.movementX, e.movementY);
//     },
//     element: 'glCanvas'
//   },
//   pointerlockchange: function pointerlockchange(e, r){
//     console.log('pointerlock change, new: ',document.pointerLockElement);
//   },
//   pointerlockerror: function pointerlockerror(e, r){
//     alert('pointerlock error!');
//   }
// }
