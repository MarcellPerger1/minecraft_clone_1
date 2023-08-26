/** @type {import('jest').Config} */
export const config = {
  verbose: true,
  coverageDirectory: "./test/coverage-jest/",
  collectCoverage: true,
  testMatch: [
    "**/test/**/*.?([mc])[jt]s?(x)", 
    "!**/test/**/*.util.?([mc])[jt]s?(x)",
    "!**/test/(helpers|coverage?(-*))/**",
    "**/?(*.)+(spec|test).?([mc])[jt]s?(x)"
  ]
};

export default config;
