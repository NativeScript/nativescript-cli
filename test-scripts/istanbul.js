"use strict";

const childProcess = require("child_process");
const path = require("path");
const pathToIstanbul = path.join(__dirname, "..", "node_modules", "istanbul", "lib", "cli.js");
const pathToMocha = path.join(__dirname, "..", "node_modules", "mocha", "bin", "_mocha");

const istanbulArgs = [ pathToIstanbul, "cover", pathToMocha ];

const nodeArgs = require("../lib/common/test-scripts/node-args").getNodeArgs();

const args = nodeArgs.concat(istanbulArgs);

const nodeProcess = childProcess.spawn("node", args, { stdio: "inherit"});
nodeProcess.on("close", (code) => {
	// We need this handler so if any test fails, we'll exit with same exit code as istanbul.
	process.exit(code);
});