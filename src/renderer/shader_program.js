import { rangeList } from "../utils/array_utils.js";


export class ShaderProgram {
  constructor(gl, glProgram) {
    this.gl = gl;
    this.program = glProgram;
    this.initVarsFromGL();
  }

  initVarsFromGL() {
    this.attrs = this.getAttrsObj();
    this.uniforms = this.getUniformsObj(this.program);
  }

  getAttrsObj() {
    return Object.fromEntries(this.getAttrInfo().map(info => {
      let loc = this.gl.getAttribLocation(this.program, info.name);
      return [info.name, loc];
    }));
  }

  getUniformsObj() {
    return Object.fromEntries(this.getUniformInfo().map(info => {
      let loc = this.gl.getUniformLocation(this.program, info.name);
      return [info.name, loc];
    }));
  }

  getUniformInfo() {
    let n = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS);
    return rangeList(n).map(i => this.gl.getActiveUniform(this.program, i));
  }

  getAttrInfo() {
    let n = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES);
    return rangeList(n).map(i => this.gl.getActiveAttrib(this.program, i));
  }
}
