./scripts/test/base.sh -c ./test/jest-config/jest-coverage.config.js "$@" &&
  node ./scripts/test/cov/process_coverage.js
