const os = require('os');
const spawnHeadlessChromium = require('run-headless-chromium').spawn;
const opn = require('opn');
const path = require('path');

const webRunTests = (staticPort, runner) =>
    new Promise((resolve, reject) => {
        const args = [`http://localhost:${staticPort()}/test/index.html`];

        if (os.type() === 'Windows_NT') {
            opn(args[0], {
                app: ['chrome', '--incognito']
            })
                .then(resolve)
                .catch(reject);
        } else {
            const chrome = spawnHeadlessChromium(args);
            chrome.stderr.on('data', d => reject(d.toString()));
            chrome.on('close', () => resolve());
            runner.on('log.end', resolve);
        }
    });

module.exports = staticPort => ['webRunTests', webRunTests, staticPort];
