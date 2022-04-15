import {GameComponent} from '../game_component.js';
import {Blocks} from '../world.js';
import {unreachable} from '../utils.js';
import {CubeVertexData} from './cube_data.js';


export class CubeDataAdder extends GameComponent {
  constructor(game, pos,
              textureData/*{side: <name>, top: <name>, bottom: <name>}*/){
    super(game);
    this.pos = pos;
    this.textureData = textureData; 
    this.cData = new CubeVertexData(this.game, pos);
    this.world.wantInRange(pos);
  }

  addData(){
    for(const [dir_index, dir_name] of Object.entries("xyz")){
      for(const [offset_name, offset_by] of Object.entries([-1,1])){
        let offset = [0,0,0];
        offset[dir_index] = offset_by;
        if(this.renderBlock(offset)){
          let data = this.cData[`side_${dir_name}${offset_name}`]();
          this.r.addData(data, this.getOffsetTexture(offset));
        }
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
    // TODO check for transparent blocks later
    if(this.world.getBlock(pos) != Blocks.air){  
      return false;
    }
    return true;
  }
}
