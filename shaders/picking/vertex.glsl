attribute vec4 aPosition;

uniform mat4 uMatrix;

void main() {
  gl_Position = uMatrix * aPosition;
}
