///<reference path=".d.ts"/>
"use strict";

import * as commonOptionsLibPath from "./common/options";
import * as osenv from "osenv";
import * as path from "path";

let OptionType = commonOptionsLibPath.OptionType;

export class Options extends commonOptionsLibPath.OptionsBase {
	constructor($errors: IErrors,
		$staticConfig: IStaticConfig,
		$hostInfo: IHostInfo) {
		super({
			frameworkPath: { type: OptionType.String },
			frameworkName: { type: OptionType.String },
			framework: { type: OptionType.String },
			frameworkVersion: { type: OptionType.String },
			copyFrom: { type: OptionType.String },
			linkTo: { type: OptionType.String  },
			release: { type: OptionType.Boolean },
			symlink: { type: OptionType.Boolean },
			forDevice: { type: OptionType.Boolean },
			client: { type: OptionType.Boolean, default: true},
			production: { type: OptionType.Boolean },
			debugTransport: {type: OptionType.Boolean},
			keyStorePath: { type: OptionType.String },
			keyStorePassword: { type: OptionType.String,},
			keyStoreAlias: { type: OptionType.String },
			keyStoreAliasPassword: { type: OptionType.String },
			sdk: { type: OptionType.String },
			ignoreScripts: {type: OptionType.Boolean },
			tnsModulesVersion: { type: OptionType.String },
			staticBindings: {type: OptionType.Boolean},
			compileSdk: {type: OptionType.Number },
			port: { type: OptionType.Number },
			copyTo: { type: OptionType.String },
			baseConfig: { type: OptionType.String }
		},
		path.join($hostInfo.isWindows ? process.env.LocalAppData : path.join(osenv.home(), ".local/share"), ".nativescript-cli"),
			$errors, $staticConfig);
	}
}
$injector.register("options", Options);
