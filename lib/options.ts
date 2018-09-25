import * as commonOptionsLibPath from "./common/options";

export class Options extends commonOptionsLibPath.OptionsBase {
	constructor($errors: IErrors,
		$staticConfig: IStaticConfig,
		$hostInfo: IHostInfo,
		$settingsService: ISettingsService) {
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
			bundle: { type: OptionType.String },
			all: { type: OptionType.Boolean },
			teamId: { type: OptionType.Object },
			syncAllFiles: { type: OptionType.Boolean, default: false },
			chrome: { type: OptionType.Boolean },
			inspector: { type: OptionType.Boolean },
			clean: { type: OptionType.Boolean },
			watch: { type: OptionType.Boolean, default: true },
			background: { type: OptionType.String },
			username: { type: OptionType.String },
			pluginName: { type: OptionType.String },
			hmr: { type: OptionType.Boolean },
			collection: { type: OptionType.String, alias: "c" },
		},
			$errors, $staticConfig, $settingsService);

		const that = (<any>this);
		// if justlaunch is set, it takes precedence over the --watch flag and the default true value
		if (that.justlaunch) {
			that.watch = false;
		}
	}
}
$injector.register("options", Options);
