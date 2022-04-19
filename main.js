import {Game} from "./src/game.js"


addEventListener('load', function(){
  var game = window.game = new Game();
  game.main();
})
