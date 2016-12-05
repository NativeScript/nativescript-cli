#!/usr/bin/env node

"use strict";
var path = require("path");
var node = require("../package.json").engines.node;
require(path.join(__dirname, "..", "lib", "common", "verify-node-version")).verifyNodeVersion(node, "NativeScript");

require("../lib/nativescript-cli.js");