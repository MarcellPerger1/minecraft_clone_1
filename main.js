import { Game } from "./src/game.js";


addEventListener('keydown', function(e) {
  if(e.key == 't') {
    var game = window.game = new Game();
  game.main();
  }
  
});
