import * as fs from "node:fs";
import { join, resolve } from "node:path";

const FILE_EXT_RE = /\.([mc]?)(js|ts)(x?)/;

/**
 * @typedef {Object} WalkDirObj
 * @prop {string} path
 * @prop {string} name
 * @prop {string} parent
 * @prop {fs.Dirent} dirent
 * @prop {(() => void) | undefined} ignore
*/
/**
 * @typedef {Object} WalkDirConfig
 * @prop {boolean} [skipExotic=true]
 * @prop {boolean} [skipDir=true]
*/

/**
 * @param {string} dir
 * @param {WalkDirConfig} cnf
 * @returns {AsyncIterable<WalkDirObj>}
 */
function walkDir(dir, cnf={}) {
  return {
    async *[Symbol.asyncIterator]() {
      for await (let de of await fs.promises.opendir(dir)) {
        let path = join(dir, de.name);
        if(de.isDirectory()) {
          let ignored = false;
          if(!(cnf.skipDir ?? true)) {
            yield {path, parent: dir, name: de.name, dirent: de, ignore() {
              ignored = true;
            }};
          }
          if(!ignored) {
            yield* walkDir(path, cnf);
          }
          continue;
        }
        if((cnf.skipExotic ?? true) && !de.isFile()) {
          continue;
        }
        yield {path, parent: dir, name: de.name, dirent: de};
      }
    }
  }
}

/**
 * @template T
 * @param {AsyncIterable<T>[]} iters
 * @returns {AsyncIterable<T>}
*/
function chainAsyncIterables(...iters) {
  return {
    async *[Symbol.asyncIterator]() {
      for(const iter of iters) {
        yield* iter;
      }
    }
  }
}

function pathEq(a, b) {
  // not sure if this aloways works but good enough
  return resolve(a) === resolve(b);
}

function shouldSkip(/**@type {WalkDirObj}*/o) {
  return pathEq(o.path, "test/coverage") || pathEq(o.path, "src/libs");
}

async function handleFile(/**@type {WalkDirObj}*/f) {
  if(!FILE_EXT_RE.test(f.name)) {
    return [];
  }
  let failures = [];
  let text = (await fs.promises.readFile(f.path)).toString();
  for(let [i, line] of text.split('\n').entries()) {
    let searchFor = pathEq(f.parent, "src/utils")
      ? ['utils/index.js']: ['./index.js', 'utils/index.js'];
    let index = 0;
    for(let s of searchFor) {
      index = line.indexOf(s);
      if(index > 0) {
        break;
      }
    }
    if(index < 0) {
      continue;
    }
    if(/noqa:\s*no-import-all-utils/i.test(line)) {
      continue;
    }
    failures.push({path: f.path, line: i+1, col: index});
  }
  return failures;
}

function formatFailure(f) {
  let s = `${resolve(f.path)}\n`
    + `\x1b[31mError:\x1b[39m   ${f.line}:${f.col}  error  `
    + `Shouldn't import from 'utils/index.js' no-import-all-utils`;
  return s;
}

let failures = [];

for await (let wd of chainAsyncIterables(
    walkDir("./src", {skipDir: false}), 
    walkDir("./test", {skipDir: false}))) {
  let de = wd.dirent;
  if(de.isDirectory()) {
    if(shouldSkip(wd)) {
      wd.ignore();
    }
    continue;
  }
  failures.push(...await handleFile(wd));
}

if(failures.length > 0) {
  for(let f of failures) {
    console.log(formatFailure(f));
  }
  process.exitCode = 1;
}
