uniform sampler2D uSampler;
varying highp vec2 vTextureCoord;


void main(void) {
  gl_FragColor = texture2D(uSampler, vTextureCoord); //vec4(0.0, 0.2, 0.1, 1.0);
}
