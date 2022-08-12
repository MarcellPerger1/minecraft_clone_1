import { assignNullSafe, deepMerge } from './utils.js';
import { loadConfigFile } from "./config_loader.js";


export class BaseConfig {
  constructor(...configs) {
    assignNullSafe(this, deepMerge([...configs]));
  }
}


/**
 * @typedef {string} path
 * @typedef {[number, number, number, number]} RGBA_Tuple
 * @typedef {[number, number, number]} Vec3
 * @typedef {[number, number]} Vec2
 * @typedef {(number|string)} SeedType
 * @typedef {{h: number, v: number}} Rot3
*/


/**
 * Config for octave noise
 * @typedef {Object} NoiseConfigT
 * @property {Vec3} nScale
 * @property {Vec3} octaveMult
 * @property {number} layers
 * @property {(number|'auto')} nMedian
 */


/**
 * World Generation Configs
 * @typedef {Object} GenerationConfigT
 * @property {SeedType} seed
 * @property {boolean} isTestWorld
 * @property {Vec3} wSize
 * @property {number} nTrees
 * @property {Vec2} treeRadius
 * @property {NoiseConfigT} baseTerrain
 * @property {NoiseConfigT} stoneOffset
*/
export class GenerationConfig extends BaseConfig { }


/**
 * Controls Configs
 * @typedef {Object} ControlsConfigT
 * @property {number} sensitivity
 * @property {[number, number]} vRotRange
 * @property {Vec2} maxMouseMove
 */
export class ControlsConfig extends BaseConfig { }


/**
 * Player Configs
 * @typedef {Object} PlayerConfigT
 * @property {Vec3} startPos
 * @property {Rot3} startRot
 * @property {number} speed
*/
export class PlayerConfig extends BaseConfig { }


/**
 * Shader Configs
 * @typedef {Object} ShaderConfigT
 * @property {path} vsPath
 * @property {path} fsPath
*/
export class ShaderConfig extends BaseConfig { }


/**
 * Atlas Configs
 * @typedef {Object} AtlasConfigT
 * @property {path} imgPath
 * @property {path} indexPath
*/
export class AtlasConfig extends BaseConfig { }


/**
 * Root Config object
 * @typedef {Object} ConfigT
 * @property {RGBA_Tuple} bgColor
 * @property {boolean} checkError
 * @property {GenerationConfigT} generation
 * @property {ControlsConfigT} controls
 * @property {PlayerConfigT} player
 * @property {ShaderConfigT} shader
 * @property {AtlasConfigT} atlas
*/
export class Config extends BaseConfig { }




/**
 * Get `Config` to use
 * @param {...(ConfigT)} extra - Extra Configs to merge
 * @returns {Promise<ConfigT>} The `Config` to use
 */
export async function getConfig(...extra) {
  let config = await loadConfigFile("./configs/config.json");
  return deepMerge([config, ...extra]);
}
