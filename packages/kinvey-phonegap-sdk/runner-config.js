const path = require('path');
const walk = require('klaw-sync');
const fs = require('fs-extra');
const osType = process.argv[2] || 'android';

const {
    Runner,
    tasks: {
        logServer,
        copy,
        copyTestRunner,
        copyTestLibs,
        runCommand,
        remove,
        processTemplateFile
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
            args: ['create', appName]
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
                tests: walk(path.join(appName, 'www', 'tests'), {
                    nodir: true
                }).map(f => `./${path.relative(appPath, f.path)}`),
                logServerPort
            }),
            path.join(appPath, 'index.html')
        ),
        copyTestRunner(appPath),
        runCommand({
            command: 'adb',
            args: [
                'reverse',
                () => `tcp:${logServerPort}`,
                () => `tcp:${logServerPort}`
            ]
        }),
        runCommand({
            command: 'cordova',
            args: ['platform', 'add', osType],
            cwd: appPath
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
                cwd: appPath
            });
        }),
        runCommand({
            command: 'cordova',
            args: ['run', osType],
            cwd: appRootPath
        })
    ]
});

runner.on('log.start', port => (logServerPort = port));

runner
    .run()
    .then(() => console.log('done'))
    .catch(err => console.log(err));
