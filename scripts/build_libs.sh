npm install
# replit doesn't serve node_modules/
cp -r ./node_modules/simplex-noise ./libs/simplex-noise
cp -r ./libs/simplex-noise/dist/esm/ ./src/libs/simplex-noise
