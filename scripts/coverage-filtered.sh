chmod +x ./scripts/test.sh && ./scripts/test.sh -c ./test/jest-config/jest-coverage-filtered.config.js "$@"
node ./scripts/process_coverage.js
