attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMatrix;

// these are then passed to the fragment shader (interpolated between vertices)
varying highp vec2 vTextureCoord;


void main(void) {
  gl_Position = uMatrix * aVertexPosition;
  vTextureCoord = aTextureCoord;
}
