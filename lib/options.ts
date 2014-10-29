///<reference path=".d.ts"/>

import path = require("path");
import helpers = require("./common/helpers");
import commonOptions = require("./common/options");
import osenv = require("osenv");

var knownOpts:any = {
		"frameworkPath": String,
		"copy-from": String,
		"link-to": String,
		"release": Boolean,
		"device": Boolean,
		"emulator": Boolean,
		"keyStorePath": String,
		"keyStorePassword": String,
		"keyStoreAlias": String,
		"keyStoreAliasPassword": String
	},
	shorthands = {
	};

_.extend(knownOpts, commonOptions.knownOpts);
_.extend(shorthands, commonOptions.shorthands);

commonOptions.setProfileDir(".nativescript-cli");
var parsed = helpers.getParsedOptions(knownOpts, shorthands);

Object.keys(parsed).forEach((opt) => exports[opt] = parsed[opt]);
exports.knownOpts = knownOpts;

declare var exports:any;
export = exports;