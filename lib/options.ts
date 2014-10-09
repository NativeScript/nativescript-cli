///<reference path=".d.ts"/>

import path = require("path");
import helpers = require("./common/helpers");
import commonOptions = require("./common/options");
import osenv = require("osenv");

var knownOpts:any = {
		"log" : String,
		"verbose" : Boolean,
		"path" : String,
		"frameworkPath": String,
		"appid" : String,
		"copy-from": String,
		"link-to": String,
		"release": Boolean,
		"device": Boolean,
		"emulator": Boolean,
		"version": Boolean,
		"help": Boolean,
		"keyStorePath": String,
		"keyStorePassword": String,
		"keyStoreAlias": String,
		"keyStoreAliasPassword": String
	},
	shorthands = {
		"v" : "verbose",
		"p" : "path"
	};

_.extend(knownOpts, commonOptions.knownOpts);
_.extend(shorthands, commonOptions.shorthands);

var defaultProfileDir = path.join(osenv.home(), ".nativescript-cli");
var parsed = helpers.getParsedOptions(knownOpts, shorthands);
parsed["profile-dir"] = parsed["profile-dir"] || defaultProfileDir;

Object.keys(parsed).forEach((opt) => exports[opt] = parsed[opt]);

exports.knownOpts = knownOpts;

declare var exports:any;
export = exports;