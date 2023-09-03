import { deepMerge } from "../utils/deep_merge.js";
import { LoaderContext } from "../config_loader.js";

// TODO: add separate common_types.ts or similar for these
type path = string;
type RGBA_Tuple = [number, number, number, number];
type Vec3 = [number, number, number];
type Vec2 = [number, number];
type SeedType = number | string;
type Rot3 = { h: number; v: number };

export interface NoiseConfigT {
  nScale: Vec3;
  octaveMult: Vec3;
  layers: number;
  nMedian: number | "auto";
}

export interface GenerationConfigT {
  seed: SeedType;
  isTestWorld: boolean;
  wSize: Vec3;
  nTrees: number;
  chunkSize: Vec3;
  treeRadius: Vec2;
  treeCollideAction: string | "avoid" | "skip" | "place";
  baseTerrain: NoiseConfigT;
  stoneOffset: NoiseConfigT;
}

export interface ControlsConfigT {
  sensitivity: number;
  vRotRange: [number, number];
  maxMouseMove: Vec2;
}

export interface PlayerConfigT {
  startPos: Vec3;
  startRot: Rot3;
  speed: number;
}

export interface ShaderProgramConfigT {
  vsPath: path;
  fsPath: path;
}

export interface ShaderConfigT extends ShaderProgramConfigT {
  picking: ShaderProgramConfigT;
}

export interface AtlasConfigT {
  imgPath: path;
  indexPath: path;
}

export interface ConfigT {
  bgColor: RGBA_Tuple;
  canvasSize: Vec2;
  generation: GenerationConfigT;
  controls: ControlsConfigT;
  player: PlayerConfigT;
  shader: ShaderConfigT;
  atlas: AtlasConfigT;
}

export async function getConfig(...extra: ConfigT[]): Promise<ConfigT> {
  let config = await new LoaderContext().loadConfigFile(
    "./configs/config.json"
  );
  return deepMerge([config, ...extra]);
}
