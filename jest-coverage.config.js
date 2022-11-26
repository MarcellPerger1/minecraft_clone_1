/** @type {import('jest').Config} */
export const config = {
  verbose: true,
  coverageDirectory: "./test/coverage/",
  collectCoverage: true,
  testMatch: [
    "**/test/**/*.?(m)[jt]s?(x)", 
    "!**/test/**/*.util.?(m)[jt]s?(x)",
    "!**/test/helpers/**",
    "**/?(*.)+(spec|test).?(m)[jt]s?(x)"
  ]
};

export default config;
