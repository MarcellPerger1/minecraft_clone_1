#!/bin/sh
npm install

# NOTE: replit doesn't serve node_modules/ so have to copy out

remake_dir () {
  rm -r $1
  mkdir $1
}

copy_lib() {
  pkg=$1
  remake_dir ./src/libs/$pkg
  cp -r ./node_modules/$pkg ./src/libs/
}

copy_lib simplex-noise
