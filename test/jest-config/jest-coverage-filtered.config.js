import base from "./jest-coverage.config.js";

/** @type {import('jest').Config} */
export const config = Object.assign({}, base, {
  collectCoverageFrom: ["./src/utils/deep_merge.js", "./src/config_loader.js"],
});

export default config;
