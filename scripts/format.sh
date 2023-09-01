shopt -s globstar
npx prettier --write ./{src,perf,test,scripts}/**/*.{js,mjs,cjs} --no-error-on-unmatched-pattern
