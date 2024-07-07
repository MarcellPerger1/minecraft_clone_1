/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prefer importing modules builtin to Node.js using the `node:` protocol",
    },
  },
  create(context) {
    console.log(context);
    return {
      // TODO
    };
  },
};
