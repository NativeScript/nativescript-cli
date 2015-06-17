///<reference path=".d.ts"/>
"use strict";

import commonOptionsLibPath = require("./common/options");
import osenv = require("osenv");
import path = require("path");

let OptionType = commonOptionsLibPath.OptionType;

export class Options extends commonOptionsLibPath.OptionsBase {
	constructor($errors: IErrors,
		$staticConfig: IStaticConfig,
		$hostInfo: IHostInfo) {
		super({
			frameworkPath: { type: OptionType.String },
			copyFrom: { type: OptionType.String },
			linkTo: { type: OptionType.String  },
			release: { type: OptionType.Boolean },
			emulator: { type: OptionType.Boolean },
			symlink: { type: OptionType.Boolean },
			forDevice: { type: OptionType.Boolean },
			client: { type: OptionType.Boolean },
			production: { type: OptionType.Boolean },
			keyStorePath: { type: OptionType.String },
			keyStorePassword: { type: OptionType.String,},
			keyStoreAlias: { type: OptionType.String },
			keyStoreAliasPassword: { type: OptionType.String },
			sdk: { type: OptionType.String }
		},
		path.join($hostInfo.isWindows ? process.env.LocalAppData : path.join(osenv.home(), ".local/share"), ".nativescript-cli"),
			$errors, $staticConfig);
	}
}
$injector.register("options", Options);
