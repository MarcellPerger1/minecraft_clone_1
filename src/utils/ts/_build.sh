./node_modules/.bin/tsc -p ./src/utils/ts/
# format the generated code
shopt -s globstar
npx prettier --write "./src/utils/ts/**/*.js" --log-level warn
