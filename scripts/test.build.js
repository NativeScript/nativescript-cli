const fs = require('fs-extra');
const glob = require('glob-promise');
const babel = require('@babel/core');
const path = require('path');
const ts = require('typescript');

async function buildJS(srcDir, buildDir, sdk) {
  // Gather all the src files
  const files = await glob(path.resolve(srcDir, '**/*.js'));

  // Transform each file with babel
  return files.map((file) => {
    return babel.transformFileAsync(file)
      .then(({ code }) => {
        return fs.outputFile(path.join(buildDir, file.replace(srcDir, '')), code.replace('__SDK__', sdk));
      });
  });
}

async function buildTS(srcDir, buildDir, sdk, compilerOptions) {
  // Gather all the src files
  const files = await glob(path.resolve(srcDir, '**/*.ts'));

  // Transform each file with babel
  return files.map((file) => {
    const tsCode = fs.readFileSync(file).toString();
    const jsCode = ts.transpileModule(tsCode, { compilerOptions });
    return fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.ts', '.js')), jsCode.outputText.replace('__SDK__', sdk));
  });
}

module.exports = {
  buildJS,
  buildTS
};
