var child_process = require("child_process");

var child = child_process.exec("node bin/nativescript.js dev-preuninstall", function (error) {
	if (error) {
		console.error("Failed to complete all pre-uninstall steps. ");
		console.log(error);
	}
});

child.stdout.pipe(process.stdout);
