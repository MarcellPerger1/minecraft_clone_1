class Renderer{
  constructor(gl, cnf, do_init=true){
    this.gl = gl;
    this.cnf = cnf;
    if(do_init){
      this.init();
    }
  }
  init(){
    this.resetCanvas();
    this.gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    this.gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  }
  resetCanvas(){
    this.gl.clearColor(...this.cnf.bgColor);
    // Clear everything
    this.gl.clearDepth(1.0);
  }
}


class RendererConfig{
  bgColor;
  constructor(cnf={}, ...args){
    Object.assign(this, cnf, ...args)
  }
}
