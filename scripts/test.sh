NODE_OPTIONS='--experimental-vm-modules --require=./test/helpers/loader.cjs' \
  npx jest --verbose --ci -c ./test/jest-config/jest.config.json $@  # --max-workers=1
