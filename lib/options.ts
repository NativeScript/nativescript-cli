import * as commonOptionsLibPath from "./common/options";
import * as osenv from "osenv";
import * as path from "path";

export class Options extends commonOptionsLibPath.OptionsBase {
	constructor($errors: IErrors,
		$staticConfig: IStaticConfig,
		$hostInfo: IHostInfo) {
		super({
			ipa: { type: OptionType.String },
			frameworkPath: { type: OptionType.String },
			frameworkName: { type: OptionType.String },
			framework: { type: OptionType.String },
			frameworkVersion: { type: OptionType.String },
			forDevice: { type: OptionType.Boolean },
			provision: { type: OptionType.Object },
			client: { type: OptionType.Boolean, default: true },
			env: { type: OptionType.Object },
			production: { type: OptionType.Boolean },
			debugTransport: { type: OptionType.Boolean },
			keyStorePath: { type: OptionType.String },
			keyStorePassword: { type: OptionType.String, },
			keyStoreAlias: { type: OptionType.String },
			keyStoreAliasPassword: { type: OptionType.String },
			ignoreScripts: { type: OptionType.Boolean },
			disableNpmInstall: { type: OptionType.Boolean },
			compileSdk: { type: OptionType.Number },
			port: { type: OptionType.Number },
			copyTo: { type: OptionType.String },
			platformTemplate: { type: OptionType.String },
			ng: { type: OptionType.Boolean },
			tsc: { type: OptionType.Boolean },
			androidTypings: { type: OptionType.Boolean },
			bundle: { type: OptionType.Boolean },
			all: { type: OptionType.Boolean },
			teamId: { type: OptionType.Object },
			syncAllFiles: { type: OptionType.Boolean, default: false },
			liveEdit: { type: OptionType.Boolean },
			chrome: { type: OptionType.Boolean },
			clean: { type: OptionType.Boolean },
			watch: { type: OptionType.Boolean, default: true }
		},
			path.join($hostInfo.isWindows ? process.env.AppData : path.join(osenv.home(), ".local/share"), ".nativescript-cli"),
			$errors, $staticConfig);

		// On Windows we moved settings from LocalAppData to AppData. Move the existing file to keep the existing settings
		// I guess we can remove this code after some grace period, say after 1.7 is out
		if ($hostInfo.isWindows) {
			try {
				const shelljs = require("shelljs"),
					oldSettings = path.join(process.env.LocalAppData, ".nativescript-cli", "user-settings.json"),
					newSettings = path.join(process.env.AppData, ".nativescript-cli", "user-settings.json");
				if (shelljs.test("-e", oldSettings) && !shelljs.test("-e", newSettings)) {
					shelljs.mkdir(path.join(process.env.AppData, ".nativescript-cli"));
					shelljs.mv(oldSettings, newSettings);
				}
			} catch (err) {
				// ignore the error - it is too early to use $logger here
			}
		}

		const that = (<any>this);
		// if justlaunch is set, it takes precedence over the --watch flag and the default true value
		if (that.justlaunch) {
			that.watch = false;
		}
	}
}
$injector.register("options", Options);
