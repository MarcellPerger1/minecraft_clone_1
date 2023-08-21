import { toRad } from "../utils/math.js";

export class Camera {
  constructor(gl, uniforms) {
    this.gl = gl;
    this.uniforms = uniforms;
    this.rotation = null;
    this.position = null;
  }

  updateFromPlayer(player) {
    this.rotation = player.rotation;
    this.position = player.position;
  }

  initMatrix() {
    this.uniforms.uMatrix.set_mat4(this.getMatrix());
  }
  getMatrix() {
    return mat4.mul(
      mat4.create(),
      this.getProjectionMatrix(),
      this.getModelViewMatrix()
    );
  }

  getProjectionMatrix() {
    const fieldOfView = toRad(45);
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(
      projectionMatrix, // dest
      fieldOfView,
      aspect,
      zNear,
      zFar
    );
    return projectionMatrix;
  }

  getModelViewMatrix() {
    var m1 = mat4.create();
    const amount = vec3.scale([], this.position, -1);
    // NOTEE: IMPORTANT!: does stuff in reverse order!!!
    // eg.: here, matrix will transalate, then rotateY, then rotateX
    mat4.rotateX(m1, m1, toRad(this.rotation.v));
    mat4.rotateY(m1, m1, toRad(this.rotation.h + 90));
    mat4.translate(m1, m1, amount);
    return m1;
  }
}
