NODE_OPTIONS='--experimental-vm-modules --require=./test/helpers/loader.cjs' \
  npx jest --verbose --ci -c ./test/jest-config/jest.config.js $@  # --max-workers=1
