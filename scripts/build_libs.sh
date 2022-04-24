npm install
# replit doesn't serve node_modules/
mkdir ./libs
cp -r ./node_modules/simplex-noise ./libs/simplex-noise
mkdir ./src/libs
cp -r ./libs/simplex-noise/dist/esm/ ./src/libs/simplex-noise
