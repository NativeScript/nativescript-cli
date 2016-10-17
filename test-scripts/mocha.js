"use strict";

const childProcess = require("child_process");
const path = require("path");
const pathToMocha = path.join(__dirname, "..", "node_modules", "mocha", "bin", "_mocha");

const nodeArgs = require("../lib/common/scripts/node-args").getNodeArgs();

const args = nodeArgs.concat(pathToMocha);

const nodeProcess = childProcess.spawn("node", args, { stdio: "inherit" });
nodeProcess.on("close", (code) => {
	// We need this handler so if any test fails, we'll exit with same exit code as mocha.
	process.exit(code);
});
