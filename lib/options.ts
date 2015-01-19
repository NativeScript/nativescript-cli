///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import helpers = require("./common/helpers");
import commonOptions = require("./common/options");
import osenv = require("osenv");
import hostInfo = require("./common/host-info");

var knownOpts:any = {
		"frameworkPath": String,
		"copy-from": String,
		"link-to": String,
		"release": Boolean,
		"device": Boolean,
		"emulator": Boolean,
		"symlink": Boolean,
		"keyStorePath": String,
		"keyStorePassword": String,
		"keyStoreAlias": String,
		"keyStoreAliasPassword": String
	},
	shorthands: IStringDictionary = {
	};

_.extend(knownOpts, commonOptions.knownOpts);
_.extend(shorthands, commonOptions.shorthands);

var defaultProfileDir = "";
var nativeScriptCacheFolder = ".nativescript-cli";
if(hostInfo.isWindows()) {
	defaultProfileDir = path.join(process.env.LocalAppData, nativeScriptCacheFolder);
} else {
	defaultProfileDir = path.join(osenv.home(), ".local/share", nativeScriptCacheFolder);
}

commonOptions.setProfileDir(defaultProfileDir);
var parsed = helpers.getParsedOptions(knownOpts, shorthands, "nativescript");

Object.keys(parsed).forEach(opt => {
	var key = opt;
	if(shorthands[opt]) {
		key = shorthands[opt];
	}

	exports[key] = parsed[opt];
});
exports.knownOpts = knownOpts;

declare var exports:any;
export = exports;
