./scripts/test/test_base.sh -c ./test/jest-config/jest-coverage.config.js "$@" &&
  node ./scripts/process_coverage.js
