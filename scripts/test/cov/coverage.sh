./scripts/test/test_base.sh -c ./test/jest-config/jest-coverage.config.js "$@" &&
  node ./scripts/test/cov/process_coverage.js
