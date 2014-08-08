///<reference path=".d.ts"/>

import path = require("path");
import helpers = require("./common/helpers");
import osenv = require("osenv");

var knownOpts:any = {
		"log" : String,
		"verbose" : Boolean,
		"path" : String,
		"appid" : String,
		"copy-from": String,
		"link-to": String,
		"release": String,
		"device": Boolean,
		"version": Boolean,
		"help": Boolean
	},
	shorthands = {
		"v" : "verbose",
		"p" : "path"
	};

var defaultProfileDir = path.join(osenv.home(), ".nativescript-cli");
var parsed = helpers.getParsedOptions(knownOpts, shorthands, defaultProfileDir);

Object.keys(parsed).forEach((opt) => exports[opt] = parsed[opt]);

exports.knownOpts = knownOpts;

declare var exports:any;
export = exports;