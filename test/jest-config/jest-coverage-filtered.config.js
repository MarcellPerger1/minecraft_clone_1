/** @type {import('jest').Config} */
export const config = {
  verbose: true,
  coverageDirectory: "./test/coverage-jest/",
  collectCoverage: true,
  collectCoverageFrom: [
    "./src/utils/deep_merge.js",
    "./src/config_loader.js"
  ],
  testMatch: [
    "**/test/**/*.?(m)[jt]s?(x)", 
    "!**/test/**/*.util.?(m)[jt]s?(x)",
    "!**/test/(helpers|coverage?(-*)|jest-config)/**",
    "**/?(*.)+(spec|test).?(m)[jt]s?(x)"
  ],
  rootDir: "./"
};

export default config;
