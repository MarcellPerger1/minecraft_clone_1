/** @type {import('jest').Config} */
export const config = {
  verbose: true,
  testMatch: [
    "**/test/**/*.?([mc])[jt]s?(x)", 
    "!**/test/**/*.util.?([mc])[jt]s?(x)",
    "!**/test/(helpers|coverage?(-*)|jest-config)/**",
    "**/?(*.)+(spec|test).?([mc])[jt]s?(x)"
  ],
  rootDir: "./"
};


export default config;
