import * as gen from'./src/world/tree_generation.js';

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


const destDiv = document.getElementById("dest");
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
    let tr = document.createElement('tr');
    rows.push(tr);
    let n = document.createElement('td');
    n.append(b.name);
    setPre(n);
    let p = document.createElement('td');
    p.append((b.stats.mean*1000).toFixed(3) + ' ms');
    p.classList.add('rjust');
    setPre(p);
    let o = document.createElement('td');
    o.append((1/b.stats.mean).toFixed(3) + ' ops/sec');
    o.classList.add('rjust');
    setPre(o);
    let u = document.createElement('td');
    u.append('+/-  ' + (b.stats.rme).toFixed(2) + '%');
    u.classList.add('rjust');
    setPre(u);
    tr.append(n, p, o, u);
    tbody.append(tr);
  });
});
suite.on('complete', () => {
  clearInterval(updatePbarInterval);
  pbar.remove();
  console.log("Done");
  console.log(suite);
  let ordered = suite.map((v, i) => [v, i])
    .sort((a, b) => 1/b[0].stats.mean - 1/a[0].stats.mean);
  let best = ordered[0];
  let e = document.createElement("td");
  e.append("Fastest");
  setPre(e);
  rows[best[1]].classList.add("perf-green");
  let s = document.createElement("td");
  s.append("Fastest");
  setPre(s);
  rows[best[1]].append(e, s);
  for(let i=1;i<rows.length;i++) {
    let v = ordered[i];
    let e = document.createElement("td");
    e.append((i+1) + (["st", "nd", "rd"][i+1] ?? "th"));
    setPre(e);
    if(i==rows.length-1) {
      rows[v[1]].classList.add("perf-red");
    } else {
      rows[v[1]].classList.add("perf-amber");
    }
    let s = document.createElement("td");
    let fracOfBest = (1/v[0].stats.mean)/(1/best[0].stats.mean)
    s.append((100*(1-fracOfBest)).toFixed(2) + "% slower");
    s.classList.add('rjust');
    setPre(s);
    rows[v[1]].append(e, s);
  }
});

globalThis.st = suite;

