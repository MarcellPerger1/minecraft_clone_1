/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    "eslint:recommended",
    "plugin:import/recommended"
  ],
  plugins: [
    "eslint-plugin-custom-rules"
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  ignorePatterns: [
    "**/libs/**"
  ],
  overrides: [
    { files: ["*.{js,mjs,cjs}"] },
    { 
      files: ".eslintrc.cjs", 
      rules: {
        "import/no-commonjs": "off"
      },
      env: {
        node: true
      }
    }
  ],
  globals: {
    progress: "writable"
  },
  rules: {
    "no-unused-vars": ["warn", {
      varsIgnorePattern: "^_",
      argsIgnorePattern: "^_"
    }],
    "import/extensions": ["error", "always"],
    "import/no-amd": ["error"],
    "import/no-commonjs": ["error"],
    // "import/no-extraneous-dependencies": ["error"],  // requires me to explicitly dev-depend on @jest/globals
    "import/no-nodejs-modules": ["error"],
    "custom-rules/prefer-node-protocol": ["warn"]  // Custom rule in scripts/eslint_rules
  }
};
