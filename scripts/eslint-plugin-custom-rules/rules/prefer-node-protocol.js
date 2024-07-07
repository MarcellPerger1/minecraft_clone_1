const { isBuiltin } = require("node:module");

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer importing modules builtin to Node.js using the `node:` protocol",
    },
    messages: {
      preferNodeProtocol:
        "'{{ moduleName }}' is a builtin Node.js module so should be prefixed with `node:`",
    },
    fixable: "code",
  },
  create(context) {
    // TODO fixer
    return {
      ImportDeclaration(node) {
        let pathNode = node.source;
        let impPath = pathNode.value;
        if (typeof impPath !== "string") {
          throw new Error("Import location must be a string literal");
        }
        if (isBuiltin(impPath) && !impPath.startsWith("node:")) {
          context.report({
            messageId: "preferNodeProtocol",
            node: pathNode,
            data: {
              moduleName: impPath,
            },
            fix(fixer) {
              return fixer.replaceTextRange(
                [pathNode.range[0] + 1, pathNode.range[1] - 1], // Exclude the quotes from the range to be replaced
                "node:" + impPath
              );
            },
          });
        }
        return;
      },
    };
  },
};
