const path = require('path');
const walk = require('klaw-sync');
const testedSdkVersion = require('./package.json').version;

const {
  Runner,
  tasks: {
    logServer,
    copy,
    copyTestRunner,
    runCommand,
    remove,
    processTemplateFile
  },
  conditionals: {
    when
  }
} = require('kinvey-universal-runner');

const appName = 'TestApp';
const currentVersionArchiveFileName = `kinvey-nativescript-sdk-${testedSdkVersion}.tgz`;
const appRootPath = path.join(__dirname, appName);
const appPath = path.join(appRootPath, 'app');
const appTestsPath = path.join(appPath, 'tests');
// the next row and the copy command should be uncommented when we add shim specific tests
// const shimSpecificTestsPath = path.join(__dirname, 'test', 'tests');
const rootMonoRepoPath = path.join(__dirname, '../../');
const commonTestsPath = path.join(rootMonoRepoPath, 'test', 'integration', 'tests');
const distPath = path.join(__dirname, 'dist');
const jsFilesFilter = item => path.extname(item.path) === '.js';
const configFileName = 'config.js';

let logServerPort;

function runPipeline(osName) {
  const runner = new Runner({
    pipeline: [
      logServer(),
      remove(distPath),
      remove(appRootPath),
      runCommand({
        command: 'npm',
        args: ['run', 'build'],
        cwd: rootMonoRepoPath
      }),
      runCommand({
        command: 'tns',
        args: ['create', appName],
        cwd: __dirname
      }),
      copy(path.join(__dirname, 'test', configFileName), path.join(appPath, configFileName)),
      copy(path.join(__dirname, 'test', 'template'), appPath),
      //   copy(
      //     shimSpecificTestsPath,
      //     appTestsPath
      //   ),
      copy(
        commonTestsPath,
        appTestsPath
      ),
      processTemplateFile(
        path.join(appPath, 'testConfig.template.hbs'),
        () => ({
          tests: walk(path.join(appTestsPath), {
            filter: jsFilesFilter,
            nodir: true
          }).map(f => String.raw`./${path.relative(appPath, f.path)}`.replace(/\\/g, '/')),
          logServerPort
        }),
        path.join(appPath, 'testConfig.js')
      ),
      runCommand({
        command: 'npm',
        args: ['pack'],
        cwd: distPath
      }),
      runCommand({
        command: 'npm',
        args: ['install', '--save', `../dist/${currentVersionArchiveFileName}`],
        cwd: appRootPath
      }),
      copyTestRunner(appPath),
      when(() => osName === 'android', runCommand({
        command: 'adb',
        args: [
          'reverse',
          () => `tcp:${logServerPort}`,
          () => `tcp:${logServerPort}`
        ]
      })),
      runCommand({
        command: 'tns',
        args: ['run', osName, '--justlaunch'],
        cwd: appRootPath
      })
    ]
  });

  runner.on('log.start', port => (logServerPort = port));

  return runner.run();
}

module.exports = runPipeline;
