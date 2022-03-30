export class Game {
  constructor(cnf){
    this.cnf = new Config(cnf);
    this.r = this.renderer = new Renderer(this.cnf);
  }

  main(){
    // TODO move everything from main.js into here 
    // and from main.js, just call this
  }
}