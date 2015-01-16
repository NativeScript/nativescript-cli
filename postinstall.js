"use strict";
var child_process = require("child_process");
var command = process.argv[0] + ' bin/nativescript.js dev-post-install';
child_process.exec(command, function(error, stdout, stderr) {
	if (stdout !== null && stdout.toString() !== "") {
		console.log('stdout: ' + stdout);
	}
	if (stderr !== null && stderr.toString() !== "") {
		console.log('stderr: ' + stderr);
	}
	if (error !== null) {
		console.log('exec error: ' + error);
	}
});
