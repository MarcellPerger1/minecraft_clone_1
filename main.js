import { Game } from "./src/game.js"


addEventListener('load', function() {
  var game = window.game = new Game();
  game.main();
});
/*
CSS :

.overlay-container {
  width: 100px;
  height: 100px;
  position: relative;
}
.behind-overlay, .overlay{
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.overlay {
  z-index: 10;
  background-color: rgba(0,0,0,0.5);
}



html:
<div class="overlay-container">
  <div class="overlay"> abcdef other text </div>
  <div class="behind-overlay">
    <canvas id="cn"></canvas>
  </div>
</div>
*/