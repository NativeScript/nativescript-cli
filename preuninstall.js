"use strict";

var path = require("path");
var child_process = require("child_process");
var commandArgs = [path.join(__dirname, "bin", "tns"), "dev-preuninstall"];

var childProcess = child_process.spawn(process.execPath, commandArgs, { stdio: "inherit"})

childProcess.on("error", (err) => {
	console.error(`Failed to complete all pre-uninstall steps. Error is ${err.message}`);
});
