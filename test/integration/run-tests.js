const path = require('path');
const program = require('commander');
const createPlatformSpecificConfig = require('./create-platform-specific-config.js');

program
  .option('--platform [type]', 'Add Platform [html5/phonegap/nativescript]')
  .option('--os [type]', 'Add OS [android/ios]')
  .parse(process.argv);

const runnerConfigFilePath = path.join(__dirname, '../../', 'packages', `kinvey-${program.platform}-sdk`, 'runner-config');

createPlatformSpecificConfig(program.platform, program.os);

const runPipeline = require(runnerConfigFilePath);
runPipeline(program.os)
  .then(() => {
    console.log('The tests passed successfully!');
    if (program.platform === 'html5') {
      process.exit(0);
    }
  })
  .catch(err => {
    const error = err || '';
    console.log(`The pipeline finished with an error!!! ${error}`);
    process.exit(1);
  });
