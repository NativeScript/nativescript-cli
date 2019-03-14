const fs = require('fs-extra');
const glob = require('glob-promise');
const babel = require('@babel/core');
const path = require('path');
const ts = require('typescript');

async function buildJS(srcDir, buildDir, allowedExtensions) {
  const files = await glob(path.resolve(srcDir, '**/*.js'));

  const promises = allowedExtensions.reduce((promises, allowedExtension) => {
    return promises.concat(files
      .map(async (file) => {
        try {
          const filename = file.split('.').slice(0, 1)[0];
          const extensions = file.split('.').slice(1);

          if (extensions.indexOf(allowedExtension) >= 0) {
            const { code } = await babel.transformFileAsync(file);
            await fs.outputFile(path.join(buildDir, `${filename.replace(srcDir, '')}.js`), code);
          }

          return file;
        } catch (error) {
          console.log(error);
        }
      })
    );
  }, []);
  await Promise.all(promises);

  const promises2 = files.map(async (file) => {
    try {
      const filename = file.split('.').slice(0, 1)[0];
      const extensions = file.split('.').slice(1);

      if (extensions.length === 1 && extensions.indexOf('js') === 0 && !fs.existsSync(path.join(buildDir, `${filename.replace(srcDir, '')}.js`))) {
        const { code } = await babel.transformFileAsync(file);
        await fs.outputFile(path.join(buildDir, `${filename.replace(srcDir, '')}.js`), code);
      }

      return file;
    } catch (error) {
      console.log(error);
    }
  });
  await Promise.all(promises2);

  return files;
}

async function buildTS(srcDir, buildDir, allowedExtensions, compilerOptions) {
  const files = await glob(path.resolve(srcDir, '**/*.ts'));

  const promises = allowedExtensions.reduce((promises, allowedExtension) => {
    return promises.concat(files
      .map(async (file) => {
        try {
          const filename = file.split('.').slice(0, 1)[0];
          const extensions = file.split('.').slice(1);

          if (extensions.indexOf(allowedExtension) >= 0) {
            const tsCode = fs.readFileSync(file).toString();
            const code = ts.transpileModule(tsCode, { compilerOptions });
            await fs.outputFile(path.join(buildDir, `${filename.replace(srcDir, '')}.js`), code.outputText);
          }

          return file;
        } catch (error) {
          console.log(error);
        }
      })
    );
  }, []);
  await Promise.all(promises);

  const promises2 = files.map(async (file) => {
    try {
      const filename = file.split('.').slice(0, 1)[0];
      const extensions = file.split('.').slice(1);

      if (extensions.length === 1 && extensions.indexOf('ts') === 0 && !fs.existsSync(path.join(buildDir, `${filename.replace(srcDir, '')}.js`))) {
        const tsCode = fs.readFileSync(file).toString();
        const code = ts.transpileModule(tsCode, { compilerOptions });
        await fs.outputFile(path.join(buildDir, `${filename.replace(srcDir, '')}.js`), code.outputText);
      }

      return file;
    } catch (error) {
      console.log(error);
    }
  });
  await Promise.all(promises2);

  return files;
}

// async function buildTS(srcDir, buildDir, allowedExtensions, compilerOptions) {
//   // Gather all the src files
//   const files = await glob(path.resolve(srcDir, '**/*.ts'));

//   const promises = allowedExtensions.map((allowedExtension) => {
//     const filteredFiles = files
//       .reduce((filteredFiles, file) => {
//         const extensions = file.split('.').slice(1);

//         // Filter any file that contains an extension that matches the
//         // allowed extension
//         if (extensions.indexOf(allowedExtension) >= 0) {
//           const index = filteredFiles.indexOf(file.replace(`.${allowedExtension}`, ''));
//           if (index >= 0) {
//             filteredFiles[index] = file;
//           } else {
//             filteredFiles.push(file);
//           }
//           // The remaining files may contain multiple extensions for other platforms.
//           // An example could be *.foo.js which does not belong in this build.
//           // We will filter any file that contains only the .ts extension
//         } else if (extensions.length === 1 && extensions.indexOf('ts') >= 0) {
//           const index = filteredFiles.indexOf(`${file.replace('.ts', '')}.${allowedExtension}.ts`);
//           if (index < 0) {
//             filteredFiles.push(file);
//           }
//         }

//         return filteredFiles;
//       }, []);

//     // Transform each file with babel
//     return filteredFiles.map((file) => {
//       const tsCode = fs.readFileSync(file).toString();
//       const jsCode = ts.transpileModule(tsCode, { compilerOptions });
//       return fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace(allowedExtension, '').replace('.ts', '.js')), jsCode.outputText);
//     });
//   });

//   return Promise.all(promises);
// }

module.exports = {
  buildJS,
  buildTS
};
