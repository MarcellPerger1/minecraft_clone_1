import {runSuite} from "../perf_test.js";

import * as gen from "../../src/world/tree_generation.js";

const DEFAULT_CONFIG = {
  wSize: [50, 12, 50],
  nTrees: 170,
  treeRadius: [1, 1],
};

export function run(conf = DEFAULT_CONFIG) {
  var suite = Benchmark.Suite("Tree placers");

  function getPlacerFn(cls) {
    return () => {
      new cls({
        cnf: {
          generation: {
            ...conf,
            seed: Math.random(),
          },
        },
      }).makeTrees();
    };
  }

  function addCls(cls) {
    suite.add(cls.name, getPlacerFn(cls));
  }

  addCls(gen.IgnoreTreePlacer);
  addCls(gen.SkipTreePlacer);
  addCls(gen.AvoidTreePlacer);

  globalThis.perfSuite = suite;
  runSuite(suite);
}

run();
