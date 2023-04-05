attribute vec4 aVertexPosition;
// attribute vec2 aTextureCoord;
//attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

// these are then passed to the fragment shader (interpolated between vertices)
// varying highp vec2 vTextureCoord;
//varying lowp vec4 vColor;


void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  // Yes, I know this line is weird but we need to tell the glsl compiler
  // to stop messing with our code by removing 'unused' 
  // (but for some weird reason still needed) attributes
  // as `aTextureCoord` being removed results in 
  // it mystreriously breaking. WHY ??? 
  // Why is webgl (or perhaps my own code) so WEIRD ???
  // vTextureCoord = aTextureCoord - aTextureCoord;
  // vTextureCoord = vec2(0., 0.);
}