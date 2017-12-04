const path = require('path');
const walk = require('klaw-sync');

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

const serveTests = require('./test/tasks/serveTests');
const webRunTests = require('./test/tasks/webRunTests');

let logServerPort;
let staticPort;

const jsFilesFilter = item => path.extname(item.path) === '.js'
const shimSpecificTests = walk(path.join(__dirname, 'test', 'tests'), {
    filter: jsFilesFilter,
    nodir: true
});
const commonTests = walk(path.join(__dirname, 'node_modules', 'kinvey-js-sdk', 'test', 'integration'), {
    filter: jsFilesFilter,
    nodir: true
});

const runner = new Runner({
    pipeline: [
        logServer(),
        // runCommand({
        //     command: 'npm',
        //     args: ['run', 'build']
        // }),
        processTemplateFile(
            path.join(__dirname, 'test', 'index.template.hbs'),
            () => ({
                tests: shimSpecificTests.concat(commonTests).map(
                    f =>
                        `./${path.relative(
                            path.join(__dirname, 'test'),
                            f.path
                        )}`
                ),
                logServerPort
            }),
            path.join(__dirname, 'test', 'index.html')
        ),
        serveTests(__dirname),
        webRunTests(() => staticPort)
    ]
});

runner.on('log.start', port => (logServerPort = port));
runner.on('serve.static', port => (staticPort = port));

runner.run().then(() => console.log('done')).catch(err => console.log(err));
