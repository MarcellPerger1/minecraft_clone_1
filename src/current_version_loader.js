import { fetchJsonFile } from "./utils/file_load.js";

// I know its a bit silly to make a request to fetch the version info
// but I don't want to hard-code it in a file as I will forget to change it.
var _version_cache = null;

async function _loadVersionInfo() {
  let package_info = await fetchJsonFile("./package.json");
  let version = package_info.version;
  if (!version) {
    throw new TypeError(
      "Invalid package.json, doesn't contain a version number"
    );
  }
  return version;
}

export async function loadVersionInfo() {
  if (_version_cache) return _version_cache;
  return (_version_cache = await _loadVersionInfo());
}

export var currentVersionLoader = {
  async loadResources() {
    let version = (currentVersionLoader.version = await loadVersionInfo());
    document.getElementById("version-info").innerText = version;
  },
  version: null,
};
