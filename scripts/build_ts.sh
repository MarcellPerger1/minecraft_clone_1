#! bash
# TODO: Do this in a way that doesn't require listing the dirs to be built (perhaps using find):
# find ./src ./test ./scripts  
#    -name node_modules -prune  
#      -o -name libs -prune 
#      -o -name coverage-* -prune 
#      -o -name coverage -prune
#    -o -type f -name tsconfig.json -print 
# | xargs ./node_modules/.bin/tsc

dirs=( ./src/utils/ts ./test/e2e/_image_snapshot_types )
for d in "${dirs[@]}"; do
  if [ -f "$d/_build.sh" ]; then
    "$d/_build.sh"
  fi
done
