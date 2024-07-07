./scripts/test/test_base.sh --ci -c ./test/jest-config/jest-coverage-filtered.config.js "$@" &&
 node ./scripts/test/cov/process_coverage.js
