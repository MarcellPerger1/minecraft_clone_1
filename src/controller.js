export function moveCamera(camPos, moveBy, hCamRotDeg, scale) {
  vec3.add(/*dest*/camPos, camPos,
      vec3.rotateY(
        // dest
        [],
        // rotate this
        vec3.scale([], moveBy, scale),  
        // center of rotation
        [0,0,0],  
        // angle
        hCamRotDeg*Math.PI/180
      )
    );
}

