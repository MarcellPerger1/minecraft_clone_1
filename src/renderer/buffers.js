import {isNumber, nameOrValue} from "../utils.js";
import {GameComponent} from "../game_component.js";


export class Buffers extends GameComponent {
  constructor(game){
    super(game);
  }
  
  make(buf_name=null){
    return (this[buf_name ?? "_"] = this.makeRaw());
  }

  makeRaw(){
    return this.gl.createBuffer();
  }
  
  makeWithData(buf_name, data, buf_type=null, usage=null){
    let raw_args = this._get_makeWithDataRaw_args(
      buf_name, data, buf_type, usage);
    if(raw_args!=null){
      return this.makeWithDataRaw(...raw_args);
    }
    this.make(buf_name);
    this.setData(buf_name, data, buf_type, usage);
    return this[buf_name];
  }

  makeWithDataRaw(data, buf_type=null, usage=null){
    const buf = this.make();
    this.setDataRaw(buf, data, buf_type, usage);
    return buf;
  }

  _get_makeWithDataRaw_args(name, data, type, usage){
    if(data==null || isNumber(data)){
      // data not array (must be type or usage) so pass first 3 args to _raw
      return [name, data, type];  
    }
    if(name==null){
      // no name, pass other 3 args to _raw
      return [data, type, usage];
    }
    return null;
  }
  
  setData(buf_name, data, buf_type=null, usage=null){
    let buf = nameOrValue(buf_name, this, "buffer");
    return this.setDataRaw(buf, data, buf_type, usage);
  }
  
  setDataRaw(buf, data, buf_type=null, usage=null){
    buf_type ??= this.gl.ARRAY_BUFFER;
    usage ??= this.gl.STATIC_DRAW;
    this.gl.bindBuffer(buf_type, buf);
    this.gl.bufferData(buf_type, data, usage);
  }
}
