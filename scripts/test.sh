NODE_OPTIONS='--experimental-vm-modules --require=./test/helpers/loader.cjs' \
  npx jest --verbose --ci --runInBand $@  # --max-workers=1
