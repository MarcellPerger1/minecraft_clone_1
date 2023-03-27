progress.addPercent(10);

import { isNumber } from "../utils/type_check.js";
import { nameOrValue, expectValue } from "../utils/general.js";
import { GameComponent } from "../game_component.js";

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
    let attr = this.programInfo.attribLocations[attrName];
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
  }

  setData(data, buf_type = null, usage = null) {
    buf_type ??= this.gl.ARRAY_BUFFER;
    usage ??= this.gl.DYNAMIC_DRAW;
    this.gl.bindBuffer(buf_type, this.id);
    this.gl.bufferData(buf_type, data, usage);
  }
}

export class Buffers extends GameComponent {
  constructor(game) {
    super(game);
  }

  make(buf_name = null) {
    return (this[buf_name ?? "_"] = this.makeRaw());
  }

  makeRaw() {
    return this.gl.createBuffer();
  }

  makeWithData(buf_name, data, buf_type = null, usage = null) {
    let raw_args = this._get_makeWithDataRaw_args(
      buf_name,
      data,
      buf_type,
      usage
    );
    if (raw_args != null) {
      return this.makeWithDataRaw(...raw_args);
    }
    this.make(buf_name);
    this.setData(buf_name, data, buf_type, usage);
    return this[buf_name];
  }

  makeWithDataRaw(data, buf_type = null, usage = null) {
    const buf = this.make();
    this.setDataRaw(buf, data, buf_type, usage);
    return buf;
  }

  _get_makeWithDataRaw_args(name, data, type, usage) {
    if (data == null || isNumber(data)) {
      // data not array (must be type or usage) so pass first 3 args to _raw
      return [name, data, type];
    }
    if (name == null) {
      // no name, pass other 3 args to _raw
      return [data, type, usage];
    }
    return null;
  }

  setData(buf_name, data, buf_type = null, usage = null) {
    let buf = nameOrValue(buf_name, this, "buffer");
    return this.setDataRaw(buf, data, buf_type, usage);
  }

  setDataRaw(buf, data, buf_type = null, usage = null) {
    buf_type ??= this.gl.ARRAY_BUFFER;
    usage ??= this.gl.STATIC_DRAW;
    this.gl.bindBuffer(buf_type, buf);
    this.gl.bufferData(buf_type, data, usage);
  }

  config(
    buf_name,
    attr_name,
    numComponents,
    type = null,
    normalize = false,
    stride = 0,
    offset = 0
  ) {
    let attr = expectValue(
      this.r.programInfo.attribLocations[attr_name],
      "attrLoc"
    );
    let buf = nameOrValue(buf_name, this, "buffer");
    type ??= this.gl.FLOAT;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
    this.gl.vertexAttribPointer(
      attr,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    this.gl.enableVertexAttribArray(attr);
  }
}
