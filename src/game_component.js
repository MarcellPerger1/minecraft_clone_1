export class GameComponent {
  constructor(game){
    this.game = game;
  }

  get cnf(){
    return this.game.cnf;
  }
}