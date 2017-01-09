"use strict";

var child_process = require("child_process");
var commandArgs = ["bin/tns", "dev-preuninstall"];
var path = require("path");
var nodeArgs = require(path.join(__dirname, "lib", "common", "scripts", "node-args")).getNodeArgs();

var child = child_process.exec("node " + nodeArgs.concat(commandArgs).join(" "), function (error) {
	if (error) {
		// Some npm versions (3.0, 3.5.1, 3.7.3) remove the NativeScript node_modules before the preuninstall script is executed and the script can't find them (the preuninstall script is like postinstall script).
		// The issue is described in the npm repository https://github.com/npm/npm/issues/8806 and it is not fixed in version 3.1.1 as commented in the conversation.
		console.error("Failed to complete all pre-uninstall steps.");
	}
});

child.stdout.pipe(process.stdout);
