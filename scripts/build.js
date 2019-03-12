const fs = require('fs-extra');
const babel = require('@babel/core');
const ts = require('typescript');

function buildJS(file) {
  return babel.transformFileAsync(file);
}

async function buildTS(file, compilerOptions) {
  const tsCode = fs.readFileSync(file).toString();
  return ts.transpileModule(tsCode, { compilerOptions });
}

module.exports = {
  buildJS,
  buildTS
};
