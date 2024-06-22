The reson we need to have a separate `_out/` directory is becuase typescript 
decides to build the ENTIRE `src/` directory (because we import stuff from `../` ?).  
Also, `exclude`-ing js files simply doesn't do anything!  
It might be a bug, it might not be, but we have to deal with it anyway.

So we build it into a separate directory and copy out only the stuff we need,
fixing the source map with `sed`. Note that we do not have to fix the actual
files as TS creates a full copy of the `src/` (incluing `ts/`) so the
relative imports still work fine when they're in the real thing.
