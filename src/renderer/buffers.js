progress.addPercent(10);

export class Buffer {
  constructor(/**@type {WebGLRenderingContext}*/ gl, programInfo, id = null) {
    /** @type {WebGLRenderingContext} */
    this.gl = gl;
    if (id == null) {
      id = this.gl.createBuffer();
    }
    this.id = id;
    this.programInfo = programInfo;
  }

  /**
   * Tell WebGL about this array buffer and its properties
   * @param {string} attrName - Name of corresponding attribute
   * @param {number} numComponents - Amount of values per vertex
   * @param {number} [content_type] - Type of each coordinate, default is gl.FLOAT
   * @param {boolean} [normalize=false] - Normalize values?
   * @param {number} [stride=0]
   * @param {number} [offset=0]
   */
  configArray(
    attrName,
    numComponents,
    content_type = null,
    normalize = false,
    stride = 0,
    offset = 0
  ) {
    let attr = this.programInfo.attrs[attrName];
    if (attr == null) {
      throw new ReferenceError(
        "There is not attribute with the name " + attrName
      );
    }
    content_type ??= this.gl.FLOAT;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.id);
    this.gl.vertexAttribPointer(
      attr,
      numComponents,
      content_type,
      normalize,
      stride,
      offset
    );
    this.gl.enableVertexAttribArray(attr);
    // allow method chaining eg. `b = new Buffer(...).configArray(...)`
    return this;
  }

  setData(data, buf_type = null, usage = null) {
    buf_type ??= this.gl.ARRAY_BUFFER;
    usage ??= this.gl.DYNAMIC_DRAW;
    this.gl.bindBuffer(buf_type, this.id);
    this.gl.bufferData(buf_type, data, usage);
  }
}
