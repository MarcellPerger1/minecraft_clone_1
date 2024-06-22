import base from "./jest.config.js";

/** @type {import('jest').Config} */
export const config = Object.assign({}, base, {
  reporters: [
    "default",
    "jest-image-snapshot/src/outdated-snapshot-reporter.js",
  ]
});

export default config;
