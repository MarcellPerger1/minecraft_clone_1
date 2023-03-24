import { readFile } from "node:fs/promises";
import { Response } from "node-fetch";

export default async function fetch(path) {
  let data = null;
  let status = 200;
  let statusText = "";
  try {
    data = await readFile(path);
  } catch (error) {
    status = 404;
    statusText = error.toString();
  }
  let response = new Response(data, { status, statusText });
  return response;
}

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}
