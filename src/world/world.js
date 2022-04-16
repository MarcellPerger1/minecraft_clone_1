import {GameComponent} from '../game_component.js';
import {fromNested, exportAs, assert, classOf, isString} from '../utils.js';

export var SIZE = [16, 16, 16];
export var LOW = [-8, -8, -8];
export var HIGH = vec3.add([], LOW, SIZE);


export class World extends GameComponent {
  constructor(game, low=LOW, size=SIZE){
    super(game);
    
    this.size = size.slice();
    this.low = low.slice();
    this.high = vec3.add(vec3.create(), this.low, this.size);
    this.origin = this.low;
    
    this.blocks = fromNested(this.size, _ => Blocks.air);
  }

  getBlock(at){
    this.wantInRange(at);
    const [x,y,z] = this.getIndex(at);
    return this.blocks[x][y][z];
  }

  setBlock(at, block=Blocks.air){
    this.wantInRange(at);
    const [x,y,z] = this.getIndex(at);
    return (this.blocks[x][y][z] = block);
  }

  setBlocks(block, positions){
    for(const p of positions){
      this.setBlock(p, block);
    }
  }

  getIndex(at){
    return vec3.sub([], at, this.origin);
  }

  getPos(at){
    return vec3.add([], at, this.origin);
  }

  inRange(pos){
    return [0,1,2].every((i) => (this.low[i] <= pos[i] && pos[i] < this.high[i]));
  }

  wantInRange(pos, msg="Position out of range"){
    assert(this.inRange(pos), msg);
  }

  *[Symbol.iterator]() {
    for(let x=0; x<this.size[0]; x++){
      for(let y=0; y<this.size[1]; y++){
        for(let z=0; z<this.size[2]; z++){
          let val = [this.getPos([x, y, z]), this.blocks[x][y][z]];
          yield val;
        }
      }
    }
  }
}


export var Blocks = {};


export class BlockType {
  static BlockByNum = [];
  static BlockByName = {};
  
  constructor(config){
    let cls = classOf(this);
    assert(config);
    if(isString(config)){
      config = {name: config};
    }
    this.config = config;
    Object.assign(this, config);
    // num
    this.num = cls.BlockByNum.length;
    // name
    this.name = config.name ?? this._getPlaceholderName();
    assert(cls.BlockByName[this.name] == null);
    // other
    this.transparent = this.config.transparent ?? false;
    this._addToRegistry();
  }

  _getPlaceholderName(){
    return `[[Block_${this.num}]]`
  }

  _addToRegistry(updateGlob=true){
    let cls = classOf(this);
    cls.BlockByName[this.name] = this;
    cls.BlockByNum.push(this);
    if(updateGlob){
      cls.updateRegistry();
    }
  }

  static updateRegistry(){
    Object.assign(Blocks, this.BlockByName, this.BlockByNum);
  }

  static addTypes(...types){
    return Object.fromEntries(types.map(t => {
      let b = new BlockType(t);
      return [b.name, b];
    }))
  }
}

BlockType.addTypes(
  {name: 'air', transparent: true},
  {name: 'grass'}
)




exportAs(World);
