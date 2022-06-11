import {GameComponent} from '../game_component.js';
import {unreachable} from '../utils.js';
import {CubeVertexData} from './cube_data.js';


export class CubeDataAdder extends GameComponent {
  constructor(game, pos,
              textureData/*{side: <name>, top: <name>, bottom: <name>}*/){
    super(game);
    this.pos = pos;
    this.textureData = textureData; 
    this.cData = new CubeVertexData(this.game, pos, this.textureData);
    this.world.wantInRange(pos);
  }

  addData(){
    for(const [offset,name] of _OFFSET_NAMES){
      if(this.renderBlock(offset)){
        let data = this.cData[name]();
        this.r.addData(data, this.getOffsetTexture(offset));
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

  renderBlock(offset){
    let pos = vec3.add([], this.pos, offset);
    if(!this.world.inRange(pos)){
      return true;  // no way for block to be there
    }
    if(this.world.getBlockUnsafe(pos).transparent){  
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
