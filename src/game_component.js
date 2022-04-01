export class GameComponent {
  constructor(game){
    this.game = game;
  }

  get cnf(){
    return this.game.cnf;
  }

  get ki(){
    return this.game.ki;
  }

  get r(){
    return this.game.r;
  }

  get canvas(){
    return this.game.canvas;
  }
}