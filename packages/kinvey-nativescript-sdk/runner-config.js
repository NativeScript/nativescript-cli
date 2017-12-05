const path = require('path');
const walk = require('klaw-sync');
const fs = require('fs-extra');

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

const testedSdkVersion = '3.7.2'
const appName = 'KinveyNativescriptTestApp';
const currentVersionArchiveFileName = `kinvey-nativescript-sdk-${testedSdkVersion}.tgz`;
const appRootPath = path.join(__dirname, appName);
const appPath = path.join(appRootPath, 'app');
const appTestsPath = path.join(appPath, 'tests');
const shimSpecificTestsPath = path.join(__dirname, 'test', 'tests');
const commonTestsPath = path.join(__dirname, 'node_modules', 'kinvey-js-sdk', 'test', 'integration');

let logServerPort;

const runner = new Runner({
    pipeline: [
        logServer(),
        remove(appRootPath),
        runCommand({
            command: 'tns',
            args: ['create', appName]
        }),
        copy(path.join(__dirname, 'test', 'template'), appPath),
        copy(
            shimSpecificTestsPath,
            appTestsPath
        ),
        copy(
            commonTestsPath,
            appTestsPath
        ),
        processTemplateFile(
            path.join(appPath, 'testConfig.template.hbs'),
            () => ({
                tests: walk(path.join(appName, 'app', 'tests'), {
                    nodir: true
                }).map(f => String.raw`./${path.relative(appPath, f.path)}`.replace(/\\/g, '/')),
                logServerPort
            }),
            path.join(appPath, 'testConfig.js')
        ),
        runCommand({
            command: 'npm',
            args: ['pack']
        }),
        runCommand({
            command: 'npm',
            args: ['install', '--production' , `../${currentVersionArchiveFileName}`],
            cwd: appRootPath
        }),
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
            command: 'tns',
            args: ['run', 'android', '--justlaunch'],
            cwd: appPath
        })
    ]
});

runner.on('log.start', port => (logServerPort = port));

runner.run().then(() => console.log('done')).catch(err => console.log(err));
