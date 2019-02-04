"use strict";

var child_process = require("child_process");
var path = require("path");
var constants = require(path.join(__dirname, "lib", "constants"));
var commandArgs = [path.join(__dirname, "bin", "tns"), constants.POST_INSTALL_COMMAND_NAME];
var helpers = require(path.join(__dirname, "lib", "common", "helpers"));
if (helpers.isInstallingNativeScriptGlobally()) {
	child_process.spawn(process.argv[0], commandArgs, { stdio: "inherit" });
}
