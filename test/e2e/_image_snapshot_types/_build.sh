./node_modules/.bin/tsc ./test/e2e/_image_snapshot_types/index.ts --lib es2023 -m nodenext -t esnext --declaration --skipLibCheck --strict
shopt -s globstar
npx prettier --write "./test/e2e/_image_snapshot_types/**/*.{js,d.ts}" --log-level warn
