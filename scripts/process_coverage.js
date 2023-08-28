import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import libCoverage from 'istanbul-lib-coverage';
import istanbulReports from 'istanbul-reports';
import libReport from 'istanbul-lib-report';
import v8ToIstanbul from 'v8-to-istanbul';
import assert from 'node:assert';
import path from 'node:path';


const DEBUG = false;


/**
 * @param {string} path
 */
function getLocalPath(path) {
  return path.startsWith('file://') ? fileURLToPath(path) : path;
}

function _pathToFilename(p) {
  return path.relative('./', getLocalPath(p)).replaceAll('/', '\\').replaceAll('.\\', '').replaceAll('\\', '-');
}

/**
 * Normalize `data` (in istanbul format converted from V8) to match the normal instanbul output
 * @param {libCoverage.CoverageMapData} data
 * @param {fs.PathLike} [file]
 * @param {string} [text]
 * @returns {Promise<libCoverage.CoverageMapData>}
 */
async function normalizeIstanbul(data, file, text) {
  // try to avoid parsing it as much as possible
  if(file == null) {
    const filenames = Object.keys(data);
    assert(filenames.length == 1, "When inferring file name, the coverage map must contain extactly 1 file");
    file = filenames[0];
  }
  text ??= await fs.promises.readFile(file, 'utf8');
  const covEntries = Object.entries(data);
  assert(covEntries.length == 1, "Must have exactly 1 file in coverage map");
  const [filename, fileData] = covEntries[0];
  const {fnMap} = fileData;
  /** @type {libCoverage.FileCoverage | libCoverage.FileCoverageData} */
  let newFileData = {...fileData};
  newFileData.fnMap = await remapFnMap(fnMap, file, text);
  return {[filename]: newFileData};
}


// ----------- fnMap -------------

// for explanation, see https://regex101.com/r/8YvGK5/4, JS version at https://regex101.com/r/IIBcVk/3
// the reason its so long: computed function names
const funcNameAndLpar_RE = /^([a-zA-Z_$][\w$]*|\[(?:[^\]'"`]|(['"`])(?:\\.|(?!\2)[^\\])*\2)*\])\s*\(/ds;
const string_RE = /^(['"`])(?:\\.|(?!\1)[^\\])*\1/ds;

/**
 * @param {{[key: string]: libCoverage.FunctionMapping}} fnMap
 * @param {fs.PathLike} file
 * @param {string} text
 * @returns {Promise<{[key: string]: libCoverage.FunctionMapping}>}
 */
async function remapFnMap(fnMap, file, text) {
  /** @type {{[key: string]: libCoverage.FunctionMapping}} */
  let newFnMap = {};
  for (let [fnKey, fnData] of Object.entries(fnMap)) {
    /** @type {libCoverage.FunctionMapping} */
    let newData = { ...fnData };
    const [newDecl, endLoc] = await remapFnDecl(fnData.decl, file, text);
    newData.decl = newDecl;
    const newLoc = await remapFnLoc(fnData.loc, file, text, endLoc);
    newData.loc = newLoc;
    newFnMap[fnKey] = newData;
  }
  return newFnMap;
}

/**
 * @param {libCoverage.Range} decl
 * @param {fs.PathLike} _file
 * @param {string} text
 * @returns {Promise<[libCoverage.Range, libCoverage.Location | null]>}
 */
async function remapFnDecl(decl, _file, text) {
  /** @type {libCoverage.Range} */
  let newDecl = {start: {...decl.start}, end: {...decl.end}};
  const line = decl.start.line;
  const lineText = text.split('\n')[line - 1];

  // fix start
  const afterStart = lineText.slice(decl.start.column);
  const matchFuncDecl = afterStart.match(/^\s*(?:async\s*)?function\s*/d);
  if(!matchFuncDecl) return [newDecl, null];
  const lastIncl = matchFuncDecl.indices[0][1];  // inclusive
  const realStart = decl.start.column + lastIncl;
  newDecl.start.column = realStart;

  // fix end
  const afterDecl = lineText.slice(realStart);
  const matchFuncName = afterDecl.match(funcNameAndLpar_RE);
  if(!matchFuncName) return [newDecl, null];
  const lparStart = matchFuncName.indices[0][1];
  const lparStartReal = realStart + lparStart;
  newDecl.end.column = lparStartReal - 1;
  newDecl.end.line = newDecl.start.line;
  return [newDecl, newDecl.end];
}
/**
 * @param {libCoverage.Range} loc
 * @param {fs.PathLike} _file
 * @param {string} text
 * @param {libCoverage.Location | null} parenStart
 * @returns {Promise<libCoverage.Range>}
 */
async function remapFnLoc(loc, _file, text, parenStart) {
  /** @type {libCoverage.Range} */
  let newLoc = {start: {...loc.start}, end: {...loc.end}};
  const lines = text.split('\n');
  if (!parenStart) return newLoc;
  const newStart = findParenEnd(text, parenStart, lines);
  newLoc.start = newStart;
  return newLoc;
}

/**
 * @param {string} text
 * @param {libCoverage.Location} start
 * @param {readonly string[]} lines
 */
function findParenEnd(text, start, lines) {
  let curr = {...start};
  let parenCount = 0;
  while (curr.line <= lines.length) {
    const char = lines[curr.line - 1][curr.column];
    if (char == '(') parenCount += 1;
    else if (char == ')') {
      parenCount -= 1;
      if (parenCount == 0) {
        const rest = lines[curr.line - 1].slice(curr.column + 1);
        return {line: curr.line, column: rest.match(/[^{]*\{/ds).indices[0][1] + curr.column};
      }
    } else if ("'\"`".includes(char)) {
      curr = findStringEnd(text, curr, lines);
    }
    let isLastInLine = curr.column >= lines[curr.line - 1].length - 1;
    // move to next char
    if(isLastInLine) {
      curr = {line: curr.line + 1, column: 0};
    } else {
      curr = {line: curr.line, column: curr.column + 1};
    }
  }
  assert(false, "parens not closed");
}

/**
 * @param {string} _text
 * @param {libCoverage.Location} start
 * @param {readonly string[]} lines
 * @returns {libCoverage.Location}
 */
function findStringEnd(_text, start, lines) {
  const restOfStartLine = lines[start.line - 1].slice(start.column);
  let m = restOfStartLine.match(string_RE);
  if(m) {
    return {line: start.line, column: m.indices[0][1] + start.column};
  }
  let curr = restOfStartLine;
  let endLine = start.line + 1;  // move to next line
  while(endLine <= lines.length) {
    curr += lines[endLine - 1];
    let m = curr.match(string_RE);
    if(m) {
      return {line: endLine, column: m.indices[0][1]};
    } 
    endLine += 1;
  }
  assert(false, 'string not closed');
}

// TODO later statementMap!


/**
 * @param {{ rawScriptCoverage?: import("inspector").Profiler.ScriptCoverage }} pptCov
 */
async function pptToIst(pptCov) {
  /** @type {import('inspector').Profiler.ScriptCoverage} */
  const rawCov = pptCov.rawScriptCoverage;
  assert(rawCov, "rawScriptCoverage not found out puppeteer coverage json (ensure it is using includeRawScriptCoverage)");
  const srcUrl = rawCov.url;
  if(srcUrl.startsWith('http:') || srcUrl.startsWith('https:')) return null;
  const srcPath = getLocalPath(rawCov.url);

  const source = await fs.promises.readFile(srcPath, 'utf8');
  const converter = v8ToIstanbul(rawCov.url, void 0, {source});  // todo support source map
  await converter.load();
  converter.applyCoverage(rawCov.functions);
  const ist = converter.toIstanbul();
  const normalIst = await normalizeIstanbul(ist, srcUrl, source);
  if (DEBUG) {
    await fs.promises.mkdir('./_temp/');
    await fs.promises.writeFile(`./_temp/${_pathToFilename(rawCov.url)}-v8.json`, JSON.stringify(rawCov));
    await fs.promises.writeFile(`./_temp/${_pathToFilename(rawCov.url)}-ist.json`, JSON.stringify(ist));
    await fs.promises.writeFile(`./_temp/${_pathToFilename(rawCov.url)}-n_ist.json`, JSON.stringify(normalIst));
  }
  return normalIst;
}

const mapJest = libCoverage.createCoverageMap(JSON.parse(await fs.promises.readFile('./test/coverage-jest/coverage-final.json', "utf8")));

const v8CovPpt = JSON.parse(await fs.promises.readFile('./test/coverage-ppt-raw/out.json', 'utf8'));
assert(Array.isArray(v8CovPpt));
const istCovPpt = (await Promise.all(v8CovPpt.map(pptToIst))).filter(v => v != null);

const covMap = libCoverage.createCoverageMap({});
covMap.merge(mapJest);
istCovPpt.forEach(covMap.merge, covMap);

istanbulReports.create('lcov').execute(libReport.createContext({dir: './test/coverage-all', coverageMap: covMap, defaultSummarizer: "nested"}));
istanbulReports.create('lcov').execute(libReport.createContext({
  dir: './test/coverage-puppeteer', 
  defaultSummarizer: "nested",
  coverageMap: libCoverage.createCoverageMap(JSON.parse(await fs.promises.readFile('./test/coverage-puppeteer/out.json', "utf8")))
}))
