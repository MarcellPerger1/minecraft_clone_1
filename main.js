import { Game } from "./src/game.js"


addEventListener('load', function() {
  var game = window.game = new Game();
  // {generation: {wSize: [32, 16, 32], }}
  // nScale: [21.14, 2, 21.14]
  game.main();
});
