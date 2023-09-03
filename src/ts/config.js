import { deepMerge } from "../utils/deep_merge.js";
import { LoaderContext } from "../config_loader.js";
export async function getConfig(...extra) {
  let config = await new LoaderContext().loadConfigFile(
    "./configs/config.json"
  );
  return deepMerge([config, ...extra]);
}
//# sourceMappingURL=config.js.map
