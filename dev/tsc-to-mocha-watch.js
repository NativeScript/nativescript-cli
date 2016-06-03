// Run "tsc" with watch, upon successful compilation run mocha tests.

var child_process = require("child_process");
var spawn = child_process.spawn;
var readline = require("readline");
var chalk = require("chalk");

var mocha = null;
var mochal = null;
var errors = 0;

function compilationStarted() {
    if (mocha) {
        mocha.kill('SIGINT');
    }
    mocha = null;
    mochal = null;
    errors = 0;
}
function foundErrors() {
    errors ++;
}
function compilationComplete() {
    if (errors) {
        console.log("       " + chalk.red("TS errors. Will not start mocha."));
        return;
    } else {
        console.log("       " + chalk.gray("Run mocha."));
    }
    mocha = spawn("./node_modules/.bin/mocha", ["--colors"]);
    mocha.on('close', code => {
        if (code) {
            console.log(chalk.gray("mocha: ") + "Exited with " + code);
        } else {
            console.log(chalk.gray("mocha: ") + chalk.red("Exited with " + code));
        }
        mocha = null;
        mochal = null;
    });
    mochal = readline.createInterface({ input: mocha.stdout });
    mochal.on('line', line => {
        console.log(chalk.gray('mocha: ') + line);
    });
}

var tsc = spawn("./node_modules/.bin/tsc", ["--watch"]);
var tscl = readline.createInterface({ input: tsc.stdout });
tscl.on('line', line => {
    console.log(chalk.gray("  tsc: ") + line);
    if (line.indexOf("Compilation complete.") >= 0) {
        compilationComplete();
    } else if (line.indexOf("File change detected.") >= 0) {
        compilationStarted();
    } else if (line.indexOf(": error TS") >= 0) {
        foundErrors();
    }
});
