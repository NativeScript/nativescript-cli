"use strict";

var child_process = require("child_process");
var commandArgs = ["bin/nativescript.js", "post-install-cli"];
var path = require("path");
var nodeArgs = require(path.join(__dirname, "lib", "common", "test-scripts", "node-args")).getNodeArgs();

child_process.spawn(process.argv[0], nodeArgs.concat(commandArgs), {stdio: "inherit"});
