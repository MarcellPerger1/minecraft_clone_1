const { Worker } = require("node:worker_threads");
const deasync = require("deasync");
const { deserialize } = require("./serialization.cjs");

/**
 * @param {string} path
 * @param {*} arg
 * @param {(error: Error, data: any) => T} cb
 * @returns {T}
 * @template T
 */
function functionWorker(path, arg, cb) {
  let w = new Worker(path);
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
  w.postMessage(arg);
  deasync.loopWhile(() => !done);
  w.terminate();
  return cb(error, data);
}

function importESM(/** @type {string} */ id) {
  return functionWorker(
    `${__dirname}/esm_importer.worker.mjs`,
    id,
    (error, data) => {
      if (error) throw error;
      if (data == null) throw new Error("Worker should've returned some data!");
      return deserialize(data);
    }
  );
}

module.exports = {
  importESM,
};
