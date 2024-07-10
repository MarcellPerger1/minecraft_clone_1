# NOTE: replit doesn't serve node_modules/ so have to copy out

remake_dir () {
  if [ -d "$1" ]; then
    rm -r "$1"
  elif [ -a "$1" ]; then
    rm "$1"
  fi
  mkdir "$1"
}

copy_lib() {
  pkg=$1
  remake_dir "./src/libs/$pkg"
  cp -r "./node_modules/$pkg" ./src/libs/
}

copy_lib simplex-noise
copy_lib gl-matrix
