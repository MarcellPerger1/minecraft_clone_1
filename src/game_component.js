/**
 * @typedef {import('./game.js').Game} Game
 */

/**
 * Anything that use the Game object should inherit from this
 */
export class GameComponent {
  /**
   * @param {(Game | GameComponent)} game
   */
  constructor(game) {
    if (game instanceof GameComponent) {
      game = game.game;
    }
    /**
     * The Game object
     * @type {Game}
     */
    this.game = game;
  }

  get cnf() {
    return this.game.cnf;
  }

  get ki() {
    return this.game.ki;
  }

  get canvas() {
    return this.game.canvas;
  }

  get deltaT() {
    return this.game.deltaT;
  }

  get player() {
    return this.game.player;
  }

  get world() {
    return this.game.world;
  }

  get renderMgr() {
    return this.game.renderMgr;
  }

  get displayRenderer() {
    return this.game.renderMgr.renderer;
  }

  get pickingRenderer() {
    return this.game.renderMgr.pickingRenderer;
  }

  get gl() {
    return this.game.renderMgr.gl;
  }
}
