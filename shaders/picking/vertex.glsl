attribute vec4 aPosition;
attribute vec4 aId;

uniform mat4 uMatrix;

varying vec4 vId;


void main() {
  gl_Position = uMatrix * aPosition;
  vId = aId;
}
