const deasync = require('deasync');
const wt = require('node:worker_threads');
const { deserialize } = require("./_serde.cjs");

function importESM(/** @type {string} */id) {
  let w = new wt.Worker(`${__dirname}/esm_importer.worker.mjs`);
  var done = false;
  var data = null;
  var error = null;
  w.on("message", (m) => {
    data = m;
    done = true;
  });
  w.on("error", (e) => {
    error = e;
    done = true;
  });
  w.on("exit", () => {
    done = true;
  });
  w.postMessage(id);
  deasync.loopWhile
  while (!done) { deasync.sleep(10); }
  w.terminate();
  if (data == null && error == null)
    throw new Error("Data was expected!");
  if (error)
    throw error;
  if (data)
    return deserialize(data);
}

module.exports = {
  importESM
};
