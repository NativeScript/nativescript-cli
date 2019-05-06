import * as helpers from "./common/helpers";
import * as yargs from "yargs";

export class Options {
	private static DASHED_OPTION_REGEX = /(.+?)([A-Z])(.*)/;
	private static NONDASHED_OPTION_REGEX = /(.+?)[-]([a-zA-Z])(.*)/;

	private optionsWhiteList = ["ui", "recursive", "reporter", "require", "timeout", "_", "$0"]; // These options shouldn't be validated
	public argv: IYargArgv;
	private globalOptions: IDictionary<IDashedOption> = {
		log: { type: OptionType.String, hasSensitiveValue: false },
		verbose: { type: OptionType.Boolean, alias: "v", hasSensitiveValue: false },
		version: { type: OptionType.Boolean, hasSensitiveValue: false },
		help: { type: OptionType.Boolean, alias: "h", hasSensitiveValue: false },
		profileDir: { type: OptionType.String, hasSensitiveValue: true },
		analyticsClient: { type: OptionType.String, hasSensitiveValue: false },
		path: { type: OptionType.String, alias: "p", hasSensitiveValue: true },
		// This will parse all non-hyphenated values as strings.
		_: { type: OptionType.String, hasSensitiveValue: false }
	};

	public options: IDictionary<IDashedOption>;

	public setupOptions(projectData: IProjectData): void {
		if (this.argv.release && this.argv.hmr) {
			this.$errors.failWithoutHelp("The options --release and --hmr cannot be used simultaneously.");
		}

		// HACK: temporary solution for 5.3.0 release (until the webpack only feature)
		const parsed = require("yargs-parser")(process.argv.slice(2), { 'boolean-negation': false });
		const noBundle = parsed && (parsed.bundle === false || parsed.bundle === 'false');
		if (noBundle && this.argv.hmr) {
			this.$errors.failWithoutHelp("The options --no-bundle and --hmr cannot be used simultaneously.");
		}

		if (projectData && projectData.useLegacyWorkflow === false) {
			this.argv.bundle = this.argv.bundle !== undefined ? this.argv.bundle : "webpack";
			this.argv.hmr = !this.argv.release;
		}

		// --no-hmr -> hmr: false or --hmr false -> hmr: 'false'
		const noHmr = parsed && (parsed.hmr === false || parsed.hmr === 'false');
		if (noHmr) {
			this.argv.hmr = false;
		}

		if (noBundle) {
			this.argv.bundle = undefined;
			this.argv.hmr = false;
		}
	}

	constructor(private $errors: IErrors,
		private $staticConfig: Config.IStaticConfig,
		private $settingsService: ISettingsService) {

		this.options = _.extend({}, this.commonOptions, this.globalOptions);
		this.setArgv();
	}

	public get shorthands(): string[] {
		const result: string[] = [];
		_.each(_.keys(this.options), optionName => {
			if (this.options[optionName].alias) {
				result.push(this.options[optionName].alias);
			}
		});
		return result;
	}

	private get commonOptions(): IDictionary<IDashedOption> {
		return {
			ipa: { type: OptionType.String, hasSensitiveValue: true },
			frameworkPath: { type: OptionType.String, hasSensitiveValue: true },
			frameworkName: { type: OptionType.String, hasSensitiveValue: false },
			framework: { type: OptionType.String, hasSensitiveValue: false },
			frameworkVersion: { type: OptionType.String, hasSensitiveValue: false },
			forDevice: { type: OptionType.Boolean, hasSensitiveValue: false },
			iCloudContainerEnvironment: { type: OptionType.String, hasSensitiveValue: false },
			provision: { type: OptionType.Object, hasSensitiveValue: true },
			client: { type: OptionType.Boolean, default: true, hasSensitiveValue: false },
			env: { type: OptionType.Object, hasSensitiveValue: false },
			production: { type: OptionType.Boolean, hasSensitiveValue: false },
			debugTransport: { type: OptionType.Boolean, hasSensitiveValue: false },
			keyStorePath: { type: OptionType.String, hasSensitiveValue: true },
			keyStorePassword: { type: OptionType.String, hasSensitiveValue: true },
			keyStoreAlias: { type: OptionType.String, hasSensitiveValue: true },
			keyStoreAliasPassword: { type: OptionType.String, hasSensitiveValue: true },
			ignoreScripts: { type: OptionType.Boolean, hasSensitiveValue: false },
			disableNpmInstall: { type: OptionType.Boolean, hasSensitiveValue: false },
			compileSdk: { type: OptionType.Number, hasSensitiveValue: false },
			port: { type: OptionType.Number, hasSensitiveValue: false },
			copyTo: { type: OptionType.String, hasSensitiveValue: true },
			js: { type: OptionType.Boolean, hasSensitiveValue: false },
			javascript: { type: OptionType.Boolean, hasSensitiveValue: false },
			ng: { type: OptionType.Boolean, hasSensitiveValue: false },
			angular: { type: OptionType.Boolean, hasSensitiveValue: false },
			vue: { type: OptionType.Boolean, hasSensitiveValue: false },
			vuejs: { type: OptionType.Boolean, hasSensitiveValue: false },
			tsc: { type: OptionType.Boolean, hasSensitiveValue: false },
			ts: { type: OptionType.Boolean, hasSensitiveValue: false },
			typescript: { type: OptionType.Boolean, hasSensitiveValue: false },
			yarn: { type: OptionType.Boolean, hasSensitiveValue: false },
			androidTypings: { type: OptionType.Boolean, hasSensitiveValue: false },
			bundle: { type: OptionType.String, hasSensitiveValue: false },
			all: { type: OptionType.Boolean, hasSensitiveValue: false },
			teamId: { type: OptionType.Object, hasSensitiveValue: true },
			chrome: { type: OptionType.Boolean, hasSensitiveValue: false },
			inspector: { type: OptionType.Boolean, hasSensitiveValue: false },
			clean: { type: OptionType.Boolean, hasSensitiveValue: false },
			watch: { type: OptionType.Boolean, default: true, hasSensitiveValue: false },
			background: { type: OptionType.String, hasSensitiveValue: false },
			username: { type: OptionType.String, hasSensitiveValue: true },
			pluginName: { type: OptionType.String, hasSensitiveValue: false },
			hmr: { type: OptionType.Boolean, hasSensitiveValue: false },
			collection: { type: OptionType.String, alias: "c", hasSensitiveValue: false },
			json: { type: OptionType.Boolean, hasSensitiveValue: false },
			avd: { type: OptionType.String, hasSensitiveValue: true },
			// check not used
			config: { type: OptionType.Array, hasSensitiveValue: false },
			insecure: { type: OptionType.Boolean, alias: "k", hasSensitiveValue: false },
			debug: { type: OptionType.Boolean, alias: "d", hasSensitiveValue: false },
			timeout: { type: OptionType.String, hasSensitiveValue: false },
			device: { type: OptionType.String, hasSensitiveValue: true },
			availableDevices: { type: OptionType.Boolean, hasSensitiveValue: false },
			appid: { type: OptionType.String, hasSensitiveValue: true },
			geny: { type: OptionType.String, hasSensitiveValue: true },
			debugBrk: { type: OptionType.Boolean, hasSensitiveValue: false },
			debugPort: { type: OptionType.Number, hasSensitiveValue: false },
			start: { type: OptionType.Boolean, hasSensitiveValue: false },
			stop: { type: OptionType.Boolean, hasSensitiveValue: false },
			ddi: { type: OptionType.String, hasSensitiveValue: true }, // the path to developer  disk image
			justlaunch: { type: OptionType.Boolean, hasSensitiveValue: false },
			file: { type: OptionType.String, hasSensitiveValue: true },
			force: { type: OptionType.Boolean, alias: "f", hasSensitiveValue: false },
			// remove legacy
			companion: { type: OptionType.Boolean, hasSensitiveValue: false },
			emulator: { type: OptionType.Boolean, hasSensitiveValue: false },
			sdk: { type: OptionType.String, hasSensitiveValue: false },
			template: { type: OptionType.String, hasSensitiveValue: true },
			certificate: { type: OptionType.String, hasSensitiveValue: true },
			certificatePassword: { type: OptionType.String, hasSensitiveValue: true },
			release: { type: OptionType.Boolean, alias: "r", hasSensitiveValue: false },
			var: { type: OptionType.Object, hasSensitiveValue: true },
			default: { type: OptionType.Boolean, hasSensitiveValue: false },
			count: { type: OptionType.Number, hasSensitiveValue: false },
			analyticsLogFile: { type: OptionType.String, hasSensitiveValue: true },
			cleanupLogFile: { type: OptionType.String, hasSensitiveValue: true },
			hooks: { type: OptionType.Boolean, default: true, hasSensitiveValue: false },
			link: { type: OptionType.Boolean, default: false, hasSensitiveValue: false },
			aab: { type: OptionType.Boolean, hasSensitiveValue: false },
			performance: { type: OptionType.Object, hasSensitiveValue: true }
		};
	}

	private get optionNames(): string[] {
		return _.keys(this.options);
	}

	private getOptionValue(optionName: string): any {
		optionName = this.getCorrectOptionName(optionName);
		return this.argv[optionName];
	}

	public validateOptions(commandSpecificDashedOptions?: IDictionary<IDashedOption>): void {
		if (commandSpecificDashedOptions) {
			_.extend(this.options, commandSpecificDashedOptions);
			this.setArgv();
		}

		const parsed = Object.create(null);
		// DO NOT REMOVE { } as when they are missing and some of the option values is false, the each stops as it thinks we have set "return false".
		_.each(_.keys(this.argv), optionName => {
			parsed[optionName] = this.getOptionValue(optionName);
		});

		_.each(parsed, (value: any, originalOptionName: string) => {
			// when this.options are passed to yargs, it returns all of them and the ones that are not part of process.argv are set to undefined.
			if (value === undefined) {
				return;
			}

			const optionName = this.getCorrectOptionName(originalOptionName);

			if (!_.includes(this.optionsWhiteList, optionName)) {
				if (!this.isOptionSupported(optionName)) {
					this.$errors.failWithoutHelp(`The option '${originalOptionName}' is not supported. To see command's options, use '$ ${this.$staticConfig.CLIENT_NAME.toLowerCase()} help ${process.argv[2]}'. To see all commands use '$ ${this.$staticConfig.CLIENT_NAME.toLowerCase()} help'.`);
				}

				const optionType = this.getOptionType(optionName),
					optionValue = parsed[optionName];

				if (_.isArray(optionValue) && optionType !== OptionType.Array) {
					this.$errors.fail("You have set the %s option multiple times. Check the correct command syntax below and try again.", originalOptionName);
				} else if (optionType === OptionType.String && helpers.isNullOrWhitespace(optionValue)) {
					this.$errors.failWithoutHelp("The option '%s' requires non-empty value.", originalOptionName);
				} else if (optionType === OptionType.Array && optionValue.length === 0) {
					this.$errors.failWithoutHelp(`The option '${originalOptionName}' requires one or more values, separated by a space.`);
				}
			}
		});
	}

	private getCorrectOptionName(optionName: string): string {
		const secondaryOptionName = this.getNonDashedOptionName(optionName);
		return _.includes(this.optionNames, secondaryOptionName) ? secondaryOptionName : optionName;
	}

	private getOptionType(optionName: string): string {
		const option = this.options[optionName] || this.tryGetOptionByAliasName(optionName);
		return option ? option.type : "";
	}

	private tryGetOptionByAliasName(aliasName: string) {
		const option = _.find(this.options, opt => opt.alias === aliasName);
		return option;
	}

	private isOptionSupported(option: string): boolean {
		if (!this.options[option]) {
			const opt = this.tryGetOptionByAliasName(option);
			return !!opt;
		}

		return true;
	}

	// If you pass value with dash, yargs adds it to yargs.argv in two ways:
	// with dash and without dash, replacing first symbol after it with its toUpper equivalent
	// ex, "$ <cli name> emulate android --profile-dir" will add profile-dir to yargs.argv as profile-dir and profileDir
	// IMPORTANT: In your code, it is better to use the value without dashes (profileDir in the example).
	// This way your code will work in case "$ <cli name> emulate android --profile-dir" or "$ <cli name> emulate android --profileDir" is used by user.
	private getNonDashedOptionName(optionName: string): string {
		const matchUpperCaseLetters = optionName.match(Options.NONDASHED_OPTION_REGEX);
		if (matchUpperCaseLetters) {
			// get here if option with upperCase letter is specified, for example profileDir
			// check if in knownOptions we have its kebabCase presentation
			const secondaryOptionName = matchUpperCaseLetters[1] + matchUpperCaseLetters[2].toUpperCase() + matchUpperCaseLetters[3] || '';
			return this.getNonDashedOptionName(secondaryOptionName);
		}

		return optionName;
	}

	private getDashedOptionName(optionName: string): string {
		const matchUpperCaseLetters = optionName.match(Options.DASHED_OPTION_REGEX);
		if (matchUpperCaseLetters) {
			const secondaryOptionName = `${matchUpperCaseLetters[1]}-${matchUpperCaseLetters[2].toLowerCase()}${matchUpperCaseLetters[3] || ''}`;
			return this.getDashedOptionName(secondaryOptionName);
		}

		return optionName;
	}

	private setArgv(): void {
		const opts: IDictionary<IDashedOption> = <IDictionary<IDashedOption>>{};
		_.each(this.options, (value: IDashedOption, key: string) => {
			opts[this.getDashedOptionName(key)] = value;
		});

		this.argv = yargs(process.argv.slice(2)).options(opts).argv;

		// For backwards compatibility
		// Previously profileDir had a default option and calling `this.$options.profileDir` always returned valid result.
		// Now the profileDir should be used from $settingsService, but ensure the `this.$options.profileDir` returns the same value.
		this.$settingsService.setSettings({ profileDir: this.argv.profileDir });
		this.argv.profileDir = this.argv["profile-dir"] = this.$settingsService.getProfileDir();

		// if justlaunch is set, it takes precedence over the --watch flag and the default true value
		if (this.argv.justlaunch) {
			this.argv.watch = false;
		}

		if (this.argv.ts || this.argv.typescript) {
			this.argv.tsc = true;
		}

		if (this.argv.angular) {
			this.argv.ng = true;
		}

		if (this.argv.vuejs) {
			this.argv.vue = true;
		}

		if (this.argv.javascript) {
			this.argv.js = true;
		}

		// Default to "nativescript-dev-webpack" if only `--bundle` is passed
		if (this.argv.bundle !== undefined || this.argv.hmr) {
			this.argv.bundle = this.argv.bundle || "webpack";
		}

		this.adjustDashedOptions();
	}

	private adjustDashedOptions(): void {
		_.each(this.optionNames, optionName => {
			Object.defineProperty(Options.prototype, optionName, {
				configurable: true,
				get: () => {
					return this.getOptionValue(optionName);
				},
				set: (value: any) => {
					this.argv[optionName] = value;
				}
			});
		});
	}
}
$injector.register("options", Options);
