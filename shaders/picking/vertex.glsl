attribute vec4 aVertexPosition;
attribute vec4 aId;

uniform mat4 uMatrix;

varying mediump vec4 vId;


void main() {
  gl_Position = uMatrix * aVertexPosition;
  vId = aId;
}
