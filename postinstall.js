"use strict";
var child_process = require("child_process");
child_process.spawn(process.argv[0], ["bin/nativescript.js", "dev-post-install"], {stdio: "inherit"});
