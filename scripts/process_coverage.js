import fs from 'node:fs';

import libCoverage from 'istanbul-lib-coverage';
import istanbulReports from 'istanbul-reports';
import libReport from 'istanbul-lib-report';


/**
 * @param {libCoverage.CoverageMap} target
 * @param {fs.PathLike | fs.promises.FileHandle} filename
 */
async function mergeFromFile(target, filename) {
  const text = await fs.promises.readFile(filename, "utf8");
  target.merge(JSON.parse(text));
}

const mapJest = libCoverage.createCoverageMap(JSON.parse(await fs.promises.readFile('./test/coverage-jest/coverage-final.json', "utf8")));
const mapPpt = libCoverage.createCoverageMap(JSON.parse(await fs.promises.readFile('./test/coverage-puppeteer/out.json', "utf8")));


const covMap = libCoverage.createCoverageMap({});
covMap.merge(mapJest);
covMap.merge(mapPpt);

istanbulReports.create('lcov').execute(libReport.createContext({dir: './test/coverage-all', coverageMap: covMap, defaultSummarizer: "nested"}));
istanbulReports.create('lcov').execute(libReport.createContext({
  dir: './test/coverage-puppeteer-final', 
  defaultSummarizer: "nested",
  coverageMap: libCoverage.createCoverageMap(JSON.parse(await fs.promises.readFile('./test/coverage-puppeteer/out.json', "utf8")))
}))
