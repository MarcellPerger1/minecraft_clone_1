import base from "./jest.config.js";

/** @type {import('jest').Config} */
export const config = Object.assign({}, base, {
  collectCoverage: true,
  coverageDirectory: "./test/coverage-jest/",
});

export default config;
