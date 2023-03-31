/** 
 * @typedef {import('./shader_program.js').ShaderProgram} ShaderProgram
 */

export class Uniform {
  constructor(gl, glProgram, id) {
    this.gl = gl;
    this.program = glProgram;
    this.id = id;
  }

  /**
   * Set a uniform to matrix `mat`
   * @param {(number[] | Float32Array)} mat - The matrix
   */
  set_mat4(mat) {
    // 2nd arg = `transpose` (must be false)
    this.gl.uniformMatrix4fv(this.id, false, mat);
  }

  set_1i(value) {
    this.gl.uniform1i(this.id, value);
  }

  
}

/** 
 * Create object of `Uniform`s
 * @pram {WebGLRenderingContext} gl
 * @param {ShaderProgram} programInfo
 * @returns {{[k: string]: Uniform}}
 */
export function makeUniformsObj(gl, programInfo) {
  return Object.fromEntries(
    Object.entries(programInfo.uniforms)
      .map(([name, id]) => [name, new Uniform(gl, programInfo.program, id)])
  );
}
