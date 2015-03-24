///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import commonOptions = require("./common/options");
import osenv = require("osenv");
import hostInfo = require("./common/host-info");

var knownOpts: any = {
		"frameworkPath": String,
		"copy-from": String,
		"link-to": String,
		"release": Boolean,
		"emulator": Boolean,
		"symlink": Boolean,
		"for-device": Boolean,
		"client": Boolean,
		"keyStorePath": String,
		"keyStorePassword": String,
		"keyStoreAlias": String,
		"keyStoreAliasPassword": String
	},
	shorthands: IStringDictionary = {
	};

_.extend(commonOptions.knownOpts, knownOpts);
_.extend(commonOptions.shorthands, shorthands);

var defaultProfileDir = "";
var nativeScriptCacheFolder = ".nativescript-cli";
if(hostInfo.isWindows()) {
	defaultProfileDir = path.join(process.env.LocalAppData, nativeScriptCacheFolder);
} else {
	defaultProfileDir = path.join(osenv.home(), ".local/share", nativeScriptCacheFolder);
}

commonOptions.setProfileDir(defaultProfileDir);
var errors: IErrors = $injector.resolve("errors");
_(errors.validateArgs("tns", commonOptions.knownOpts, commonOptions.shorthands)).each((val,key) => {
	key = shorthands[key] || key;
	commonOptions[key] = val;
}).value();
exports.knownOpts = knownOpts;

declare var exports:any;
export = exports;
