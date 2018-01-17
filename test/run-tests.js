const program = require('commander');

program
  .option('--platform [type]', 'Add Platform [html5/phonegap/nativescript]')
  .option('--os [type]', 'Add OS [android/ios]')
  .parse(process.argv);


const runnerConfigFilePath = `../packages/kinvey-${program.platform}-sdk/runner-config`;
const runPipeline = require(runnerConfigFilePath);
runPipeline(program.os);

