import * as gen from '../../src/world/tree_generation.js';

var suite = Benchmark.Suite("tree placers");


var conf = {
  wSize: [50, 12, 50], 
  nTrees: 170, 
  treeRadius: [1, 1],
}

function getPlacerFn(cls) {
  return () => {
    new cls({
      cnf: {
        generation: {
          ...conf,
          seed: Math.random()
        }
      }
    }).makeTrees()
  }
}

function addCls(cls) {
  suite.add(cls.name, getPlacerFn(cls));
}

addCls(gen.IgnoreTreePlacer);
addCls(gen.SkipTreePlacer);
addCls(gen.AvoidTreePlacer);
addCls(gen.AvoidTreePlacerFast);

suite.run({async: true});

function setPre(e) {
  e.classList.add('mono-font');
  return e;
}

function makeElem(tagname, children=[], classList=[]) {
  let e = document.createElement(tagname);
  e.append(...children);
  e.classList.add(...classList);
  return e;
}


const progDiv = document.getElementById("prog-div");
const pbar = document.getElementById("pbar")
const tbody = document.getElementById('table-body');
let nDone = 0;
let startedAt = Date.now()/1000;

let updatePbarInterval = setInterval(() => {
  pbar.value = 0.25 * nDone + 0.25*((Date.now()/1000 - startedAt)/7)
}, 100);

let rows = [];

suite.map((b, i) => {
  b.on('complete', () => {
    nDone++;
    startedAt = Date.now()/1000;
    console.log(`Benchmark ${i+1} done.`);
    let tr = makeElem('tr');
    rows.push(tr);
    let n = makeElem('td', [b.name], ['mono-font']);
    let p = makeElem(
      'td', [(b.stats.mean*1000).toFixed(3) + ' ms'], ['rjust', 'mono-font']);
    let o = makeElem(
      'td', [(1 / b.stats.mean).toFixed(3) + ' ops/sec'], ['rjust', 'mono-font']);
    let u = makeElem(
      'td', ['+/-  ' + (b.stats.rme).toFixed(2) + '%'], ['rjust', 'mono-font']);
    tr.append(n, p, o, u);
    tbody.append(tr);
  });
});
suite.on('complete', () => {
  clearInterval(updatePbarInterval);
  progDiv.remove();
  console.log("Done");
  console.log(suite);
  let ordered = suite.map((v, i) => [v, i])
    .sort((a, b) => 1/b[0].stats.mean - 1/a[0].stats.mean);
  let [bestBench, bestRowIdx] = ordered[0];
  let bestOpsPerSec = 1/bestBench.stats.mean;
  let bestRow = rows[bestRowIdx];
  let nth = makeElem("td", ["Fastest"], ["mono-font"]);
  let slowerBy = makeElem("td", ["Fastest"], ["mono-font"]);
  bestRow.classList.add("perf-green");
  bestRow.append(nth, slowerBy);
  for(let i=1;i<ordered.length;i++) {
    let [bench, rowIdx] = ordered[i];
    let row = rows[rowIdx];
    row.classList.add((i == rows.length-1) ? "perf-red": "perf-amber");
    let nthText = (i+1) + (["st", "nd", "rd"][i+1] ?? "th");
    let nth = makeElem("td", [nthText], ["mono-font"]);
    let opsPerSec = 1/bench.stats.mean;
    let fracOfBest = opsPerSec/bestOpsPerSec;
    let slowerBy = makeElem(
      "td", [(100*(1-fracOfBest)).toFixed(2) + "% slower"], ['rjust', 'mono-font']);
    row.append(nth, slowerBy);
  }
});

globalThis.st = suite;
