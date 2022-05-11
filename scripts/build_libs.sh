npm install

# NOTE: replit doesn't serve node_modules/ so have to copy out

remake_dir () {
  rm -r $1
  mkdir $1
}

remake_dir ./src/libs
cp -r ./node_modules/simplex-noise/dist/esm/ ./src/libs/simplex-noise
