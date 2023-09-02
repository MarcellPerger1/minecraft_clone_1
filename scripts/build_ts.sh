# TODO: Do this in a way that doesn't require listing the dirs to be built (perhaps using find):
# find ./src ./test ./scripts  
#    -name node_modules -prune  
#      -o -name libs -prune 
#      -o -name coverage-* -prune 
#      -o -name coverage -prune
#    -o -type f -name tsconfig.json -print 
# | xargs ./node_modules/.bin/tsc
QUIET=false

dirs=( ./src/utils/ts ./src/ts ./test/e2e/_image_snapshot_types )
for d in "${dirs[@]}"; do
  if [ -f "$d/_build.sh" ]; then
    if [ "$QUIET" = true ]; then
      "$d/_build.sh"
    else
      echo "Building $d"
      startt=$(date +%s%N)
      "$d/_build.sh"
      endt=$(date +%s%N)
      deltat=$(printf '%.2f' "$((endt - startt))e-9")
      echo "Built    $d in ${deltat}s"
    fi
  fi
done
