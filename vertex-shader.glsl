attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
//attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

// these are then passed to the fragment shader (interpolated between vertices)
varying highp vec2 vTextureCoord;
//varying lowp vec4 vColor;


void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  //vColor = aVertexColor;
  vTextureCoord = aTextureCoord;
}