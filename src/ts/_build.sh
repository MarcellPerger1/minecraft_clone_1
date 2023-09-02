thisdir="$( dirname -- "${BASH_SOURCE[0]}" )"
./node_modules/.bin/tsc -p "$thisdir/tsconfig.json"
cp "$thisdir"/_out/ts/* "$thisdir"
rm -r "$thisdir/_out"
# format the generated code
shopt -s globstar
npx prettier --write "$thisdir/**/*.js" --loglevel=warn
