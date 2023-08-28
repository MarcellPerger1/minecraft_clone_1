/** @type {import('jest').Config} */
export const config = {
  verbose: true,
  testMatch: [
    "**/test/**/*.?([mc])[jt]s?(x)", 
    "!**/test/**/*.util.?([mc])[jt]s?(x)",
    "!**/test/(helpers|coverage?(-*)|jest-config)/**",
    "**/?(*.)+(spec|test).?([mc])[jt]s?(x)"
  ],
  rootDir: "../../"  // TODO don't hard-code this, use path.relative
};


export default config;
