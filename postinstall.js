"use strict";

var child_process = require("child_process");
var path = require("path");
var fs = require("fs");
// In the published package dist/ is the root; in a source checkout the compiled
// output lives under dist/ while lib/ holds only TypeScript.
var distLib = path.join(__dirname, "dist", "lib");
var pathToLib = fs.existsSync(distLib) ? distLib : path.join(__dirname, "lib");
var constants = require(path.join(pathToLib, "constants"));
var commandArgs = [path.join(__dirname, "bin", "tns"), constants.POST_INSTALL_COMMAND_NAME];
var helpers = require(path.join(pathToLib, "common", "helpers"));
if (helpers.isInstallingNativeScriptGlobally()) {
	child_process.spawn(process.argv[0], commandArgs, { stdio: "inherit" });
}
