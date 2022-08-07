import {isString, classOf, assert, fromKeys, setDefaults, assignNullSafe} from '../utils.js';

/**
 * Type of the argument to `new BlockType()`
 * @typedef {Object} ConfigObj
 * @prop {string} [name]
 * @prop {string} [texture]
 * @prop {{top?: string, side?: string, bottom?: string, all?: string}} [textures]
 * @prop {boolean} [visible=true]
 * @prop {boolean} [transparent=false]
 */

/**
 * Represents a type of block eg. grass
 */
export class BlockType {
  static BlockByNum = [];
  static BlockByName = {};

  /**
   * Make a new block type
   * @param {ConfigObj | string} config
   */
  constructor(config){
    let cls = classOf(this);
    assert(config);
    if(isString(config)){
      config = {name: config};
    }
    /** @type {ConfigObj} */
    this.config = config;
    Object.assign(this, config);
    // num
    this.num = cls.BlockByNum.length;
    // name
    this.name = this.config.name ?? this._getPlaceholderName();
    assert(cls.BlockByName[this.name] == null);
    // textures
    this._getTextures();
    // transparency
    this.transparent ??= false;
    this.visible ??= true;
    this._addToRegistry();
  }

  _getTextures(){
    this.textures ??= {};
    let d = this.textures?.all ?? this.texture;
    setDefaults(this.textures, fromKeys(['top', 'side', 'bottom'], d));
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
    assignNullSafe(Blocks, this.BlockByName, this.BlockByNum);
    Blocks.count = Blocks.n = this.BlockByNum.length;
  }

  /**
   * Add multiple types of blocks
   * @param {Array<ConfigObj | string>} types
  */
  static addTypes(...types){
    return Object.fromEntries(types.map(t => {
      let b = new BlockType(t);
      return [b.name, b];
    }))
  }
}

/**
 * All the blocks
 * @type {Object.<string, BlockType>}
 */
export var Blocks = {};


BlockType.addTypes(
  {name: 'air', transparent: true, visible: false},
  {name: 'grass', textures: {
    top: 'grass_top',
    side: 'grass_side',
    bottom: 'grass_bottom'}
  }, 
  {name: 'stone', texture: 'stone'},
  {name: 'dirt', texture: 'grass_bottom'},
  {name: 'oak_log', textures: {
    top: 'oak_log_top',
    bottom: 'oak_log_top',
    side: 'oak_log_side'}
  },
  {name: "oak_leaves", texture: "oak_leaves_basic", transparent: true},
)
