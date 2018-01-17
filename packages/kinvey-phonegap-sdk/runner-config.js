const path = require('path');
const walk = require('klaw-sync');

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

const appName = 'KinveyCordovaTestApp';
const appRootPath = path.join(__dirname, appName);
const appPath = path.join(appRootPath, 'www');
const appTestsPath = path.join(appPath, 'tests');
const shimTestsPath = path.join(__dirname, 'test', 'tests');
const rootMonoRepoPath = path.join(__dirname, '../../');
const commonTestsPath = path.join(rootMonoRepoPath, 'test', 'integration');
const distPath = path.join(__dirname, 'dist');
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
        command: 'cordova',
        args: ['create', appName],
        cwd: __dirname
      }),
      copy(path.join(__dirname, 'test', 'template'), appPath),
      copy(distPath, appPath),
      copy(
          shimTestsPath,
          appTestsPath
      ),
      copy(
        commonTestsPath,
        appTestsPath
      ),
      processTemplateFile(
        path.join(appPath, 'index.template.hbs'),
        () => ({
          tests: walk(path.join(appPath, 'tests'), {
            nodir: true
          }).map(f => `./${path.relative(appPath, f.path)}`),
          logServerPort
        }),
        path.join(appPath, 'index.html')
      ),
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
        command: 'cordova',
        args: ['platform', 'add', osName],
        cwd: appRootPath
      }),
      ...[
        'https://github.com/apache/cordova-plugin-file.git',
        'https://github.com/apache/cordova-plugin-whitelist',
        'https://github.com/apache/cordova-plugin-file-transfer.git',
        'cordova-sqlite-storage'
      ].map(p => {
        return runCommand({
          command: 'cordova',
          args: ['plugin', 'add', '--force', p],
          cwd: appRootPath
        });
      }),
      runCommand({
        command: 'cordova',
        args: ['run', osName],
        cwd: appRootPath
      })
    ]
  });


  runner.on('log.start', port => (logServerPort = port));

  runner
    .run()
    .then(() => console.log('done'))
    .catch(err => console.log(err));
}

module.exports = runPipeline;
