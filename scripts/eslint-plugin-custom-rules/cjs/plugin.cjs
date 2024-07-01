const {importESM} = require("./esm_importer.cjs");

function importModule() {
  let out = importESM("../plugin.mjs").default;
  if(!out?.rules?.["prefer-node-protocol"]) {
    console.log(out);
    throw new Error("importESM() didn't import the correct module");
  }
  return out;
}

module.exports = importModule();
