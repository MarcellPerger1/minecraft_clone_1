import {sortCoords} from '../utils.js';

export class CubeData {
  constructor(p0, p1){
    [this.p0, this.p1] = sortCoords(p0, p1);
  }

  side_x0(){
    const [x0, y0, z0] = this.p0;
    const [_x1, y1, z1] = this.p1;
    const sides = {'position': [
      x0, y0, z0,
      x0, y0, z1,
      x0, y1, z1,
      x0, y1, z0,
    ], 'textureCoord': [
      0.0,  1.0,
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
    ], 'indices': [
      0, 1, 2,     0, 2, 3,
    ]};
    return sides;
  }

  side_x1(){
    const [_x0, y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const sides = {'position': [
      x1, y0, z0, 
      x1, y1, z0,
      x1, y1, z1,
      x1, y0, z1,
    ], 'textureCoord': [
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
      0.0,  1.0,
    ], 'indices':[
      0,  1,  2,      0,  2,  3,
    ]};
    return sides;
  }

  side_z0(){
    const [x0, y0, z0] = this.p0;
    const [x1, y1, _z1] = this.p1;
    const sides = {'position': [
      x0, y0, z0,
      x0, y1, z0,  
      x1, y1, z0,
      x1, y0, z0,
    ], 'textureCoord': [
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
      0.0,  1.0,
    ], 'indices': [
      0,  1,  2,      0,  2,  3,
    ]};
    return sides;
  }

  side_z1(){
    const [x0, y0, _z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const sides = {'position': [
      x0, y0, z1,
      x1, y0, z1,
      x1, y1, z1,
      x0, y1, z1,
    ], 'textureCoord': [
      0.0,  1.0,
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
    ], 'indices': [
      0,  1,  2,      0,  2,  3,
    ]};
    return sides;
  }

  top(){
    const [x0, _y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const ret = {'position': [
      x0, y1, z0,
      x0, y1, z1,
      x1, y1, z1,
      x1, y1, z0,
    ],'textureCoord': [
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
    ],'indices': [
      0, 1, 2,     0, 2, 3,   // top
    ]};
    return ret;
  }
  
  bottom(){
    const [x0, y0, z0] = this.p0;
    const [x1, _y1, z1] = this.p1;
    const ret = {'position': [
      x0, y0, z0,
      x1, y0, z0,
      x1, y0, z1,
      x0, y0, z1,
    ],'textureCoord': [
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
    ],'indices': [
      0, 1, 2,     0, 2, 3,   // bottom
    ]};
    return ret;
  }
  
  side_y0(){
    return this.bottom();
  }
  
  side_y1(){
    return this.top();
  }
  
  sides(){
    const [x0, y0, z0] = this.p0;
    const [x1, y1, z1] = this.p1;
    const sides = {'position': [
      // Front face
      x0, y0, z1,
      x1, y0, z1,
      x1, y1, z1,
      x0, y1, z1,
    
      // Back face
      x0, y0, z0,
      x0, y1, z0,  
      x1, y1, z0,
      x1, y0, z0,
    
      // Right face
      x1, y0, z0, 
      x1, y1, z0,
      x1, y1, z1,
      x1, y0, z1,
    
      // Left face
      x0, y0, z0,
      x0, y0, z1,
      x0, y1, z1,
      x0, y1, z0,
    ], 'textureCoord': [
      // Front
      0.0,  1.0,
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
      // Back
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
      0.0,  1.0,
      // Right
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
      0.0,  1.0,
      // Left
      0.0,  1.0,
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
    ], 'indices': [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // right
      12, 13, 14,     12, 14, 15,   // left
    ]};
    return sides;
  }
}
