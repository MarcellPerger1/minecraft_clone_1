import {GameComponent} from '../game_component.js';
import {unreachable} from '../utils.js';
import {CubeVertexData} from './cube_data.js';


export class CubeDataAdder extends GameComponent {
  constructor(game, pos,
              /** @type {{side: string, top: string, bottom: string}} */textureData){
    super(game);
    this.pos = pos;
    this.textureData = textureData; 
    this.cData = new CubeVertexData(this.game, pos, this.textureData);
    this.block = this.world.getBlock(this.pos);
  }

  addData(){
    if(!this.block.visible) { return; }
    for(const [offset,name] of _OFFSET_NAMES){
      if(this.shouldRenderSide(offset)){
        let data = this.cData[name]();
        this.r.addData(data, this.getOffsetTexture(offset), this.block.transparent);
      }
    }
  }

  getOffsetTexture(offset){
    return this.textureData[this.getOffsetTextureName(offset)];
  }

  getOffsetTextureName(offset){
    switch(offset[1]){
      case 0:
        return 'side';
      case -1:
        return 'bottom';
      case 1:
        return 'top';
      default:
        unreachable();
    }
  }

  addDataToRenderer(data, texture){
    this.r.addData(data, texture);
  }

  shouldRenderSide(offset){
    let pos = vec3.add([], this.pos, offset);
    if(!this.world.inRange(pos)){
      return true;  // no way for block to be there
    }
    let side_block = this.world.getBlockUnsafe(pos);
    if(!side_block.visible) {
      return true;
    }
    if(this.block.transparent && side_block.transparent && offset.some(c=>c>0)) {
      return false;
    }
    if(side_block.transparent){  
      return true;
    }
    return false;
  }
}

const _OFFSET_NAMES = [
  [vec3.fromValues(-1,0,0), 'side_x0'],
  [vec3.fromValues(1,0,0), 'side_x1'],
  [vec3.fromValues(0,-1,0), 'side_y0'],
  [vec3.fromValues(0,1,0), 'side_y1'],
  [vec3.fromValues(0,0,-1), 'side_z0'],
  [vec3.fromValues(0,0,1), 'side_z1'],
]
