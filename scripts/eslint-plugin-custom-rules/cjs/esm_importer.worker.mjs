/* eslint-env worker, node */
import { parentPort } from "node:worker_threads";
import { serialize } from "./serialization.cjs";

parentPort.on("message", async (id) => {
  parentPort.postMessage(serialize(await import(id)));
});
