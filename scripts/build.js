const fs = require('fs-extra');
const babel = require('@babel/core');
const ts = require('typescript');
const ngc = require('@angular/compiler-cli');

function buildJS(file) {
  return babel.transformFileAsync(file);
}

async function buildTS(file, compilerOptions) {
  const program = ngc.createProgram([file], compilerOptions);
  // const program = ngc.createProgram({
  //   rootNames: [file],
  //   options: compilerOptions
  // });
  // return program.emit();
  // const tsCode = fs.readFileSync(file).toString();
  // return ts.transpileModule(tsCode, { compilerOptions });
}

module.exports = {
  buildJS,
  buildTS
};
