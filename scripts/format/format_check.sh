shopt -s globstar
npx prettier --check ./{src,perf,test,scripts}/**/*.{js,mjs,cjs,ts} --no-error-on-unmatched-pattern "$@"
