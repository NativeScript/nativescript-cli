import * as helpers from "./common/helpers";
import * as yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as _ from "lodash";
import {
	IDictionary,
	IDashedOption,
	OptionType,
	IErrors,
	ISettingsService,
} from "./common/declarations";
import { injector } from "./common/yok";
import { APP_FOLDER_NAME } from "./constants";
export class Options {
	private static DASHED_OPTION_REGEX = /(.+?)([A-Z])(.*)/;
	private static NONDASHED_OPTION_REGEX = /(.+?)[-]([a-zA-Z])(.*)/;

	private optionsWhiteList = [
		"ui",
		"recursive",
		"reporter",
		"require",
		"timeout",
		"_",
		"$0",
	]; // These options shouldn't be validated
	private globalOptions: IDictionary<IDashedOption> = {
		log: { type: OptionType.String, hasSensitiveValue: false },
		verbose: { type: OptionType.Boolean, hasSensitiveValue: false },
		version: { type: OptionType.Boolean, alias: "v", hasSensitiveValue: false },
		help: { type: OptionType.Boolean, alias: "h", hasSensitiveValue: false },
		profileDir: { type: OptionType.String, hasSensitiveValue: true },
		analyticsClient: { type: OptionType.String, hasSensitiveValue: false },
		path: { type: OptionType.String, alias: "p", hasSensitiveValue: true },
		config: { type: OptionType.String, alias: "c", hasSensitiveValue: true },
		// This will parse all non-hyphenated values as strings.
		_: { type: OptionType.String, hasSensitiveValue: false },
	};

	private initialArgv: yargs.Arguments;
	public argv: yargs.Arguments;
	public options: IDictionary<IDashedOption>;

	public setupOptions(
		commandSpecificDashedOptions?: IDictionary<IDashedOption>
	): void {
		if (commandSpecificDashedOptions) {
			_.extend(this.options, commandSpecificDashedOptions);
			this.setArgv();
		}

		this.argv.bundle = "webpack";

		// Check if the user has explicitly provide --hmr and --release options from command line
		if (this.initialArgv.release && this.initialArgv.hmr) {
			this.$errors.fail(
				"The options --release and --hmr cannot be used simultaneously."
			);
		}

		if (this.argv.hmr) {
			this.argv.hmr = !this.argv.release;
		}

		if (this.argv.debugBrk) {
			// we cannot use HMR along with debug-brk because we have to restart the app
			// on each livesync in order to stop and allow debugging on app start
			this.argv.hmr = false;
		}

		if (this.argv.justlaunch) {
			this.argv.hmr = false;
		}
	}

	constructor(
		private $errors: IErrors,
		private $settingsService: ISettingsService
	) {
		this.options = _.extend({}, this.commonOptions, this.globalOptions);
		this.setArgv();
	}

	public get shorthands(): string[] {
		const result: string[] = [];
		_.each(_.keys(this.options), (optionName) => {
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
			iCloudContainerEnvironment: {
				type: OptionType.String,
				hasSensitiveValue: false,
			},
			provision: { type: OptionType.Object, hasSensitiveValue: true },
			client: {
				type: OptionType.Boolean,
				default: true,
				hasSensitiveValue: false,
			},
			env: { type: OptionType.Object, hasSensitiveValue: false },
			production: { type: OptionType.Boolean, hasSensitiveValue: false },
			debugTransport: { type: OptionType.Boolean, hasSensitiveValue: false },
			keyStorePath: { type: OptionType.String, hasSensitiveValue: true },
			keyStorePassword: { type: OptionType.String, hasSensitiveValue: true },
			keyStoreAlias: { type: OptionType.String, hasSensitiveValue: true },
			keyStoreAliasPassword: {
				type: OptionType.String,
				hasSensitiveValue: true,
			},
			ignoreScripts: { type: OptionType.Boolean, hasSensitiveValue: false },
			disableNpmInstall: { type: OptionType.Boolean, hasSensitiveValue: false },
			compileSdk: { type: OptionType.Number, hasSensitiveValue: false },
			port: { type: OptionType.Number, hasSensitiveValue: false },
			copyTo: { type: OptionType.String, hasSensitiveValue: true },
			js: { type: OptionType.Boolean, hasSensitiveValue: false },
			javascript: { type: OptionType.Boolean, hasSensitiveValue: false },
			ng: { type: OptionType.Boolean, hasSensitiveValue: false },
			angular: { type: OptionType.Boolean, hasSensitiveValue: false },
			react: { type: OptionType.Boolean, hasSensitiveValue: false },
			reactjs: { type: OptionType.Boolean, hasSensitiveValue: false },
			vue: { type: OptionType.Boolean, hasSensitiveValue: false },
			vuejs: { type: OptionType.Boolean, hasSensitiveValue: false },
			svelte: { type: OptionType.Boolean, hasSensitiveValue: false },
			tsc: { type: OptionType.Boolean, hasSensitiveValue: false },
			ts: { type: OptionType.Boolean, hasSensitiveValue: false },
			typescript: { type: OptionType.Boolean, hasSensitiveValue: false },
			yarn: { type: OptionType.Boolean, hasSensitiveValue: false },
			yarn2: { type: OptionType.Boolean, hasSensitiveValue: false },
			pnpm: { type: OptionType.Boolean, hasSensitiveValue: false },
			androidTypings: { type: OptionType.Boolean, hasSensitiveValue: false },
			bundle: { type: OptionType.String, hasSensitiveValue: false },
			all: { type: OptionType.Boolean, hasSensitiveValue: false },
			teamId: { type: OptionType.Object, hasSensitiveValue: true },
			chrome: { type: OptionType.Boolean, hasSensitiveValue: false },
			inspector: { type: OptionType.Boolean, hasSensitiveValue: false },
			clean: { type: OptionType.Boolean, hasSensitiveValue: false },
			watch: {
				type: OptionType.Boolean,
				default: true,
				hasSensitiveValue: false,
			},
			background: { type: OptionType.String, hasSensitiveValue: false },
			username: { type: OptionType.String, hasSensitiveValue: true },
			pluginName: { type: OptionType.String, hasSensitiveValue: false },
			includeTypeScriptDemo: {
				type: OptionType.String,
				hasSensitiveValue: false,
			},
			includeAngularDemo: { type: OptionType.String, hasSensitiveValue: false },
			hmr: {
				type: OptionType.Boolean,
				hasSensitiveValue: false,
				default: true,
			},
			collection: {
				type: OptionType.String,
				alias: "c",
				hasSensitiveValue: false,
			},
			json: { type: OptionType.Boolean, hasSensitiveValue: false },
			avd: { type: OptionType.String, hasSensitiveValue: true },
			// check not used
			config: { type: OptionType.Array, hasSensitiveValue: false },
			insecure: {
				type: OptionType.Boolean,
				alias: "k",
				hasSensitiveValue: false,
			},
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
			emulator: { type: OptionType.Boolean, hasSensitiveValue: false },
			simulator: { type: OptionType.Boolean, hasSensitiveValue: false },
			sdk: { type: OptionType.String, hasSensitiveValue: false },
			template: { type: OptionType.String, hasSensitiveValue: true },
			certificate: { type: OptionType.String, hasSensitiveValue: true },
			certificatePassword: { type: OptionType.String, hasSensitiveValue: true },
			release: {
				type: OptionType.Boolean,
				alias: "r",
				hasSensitiveValue: false,
			},
			markingMode: { type: OptionType.Boolean, hasSensitiveValue: false },
			var: { type: OptionType.Object, hasSensitiveValue: true },
			default: { type: OptionType.Boolean, hasSensitiveValue: false },
			count: { type: OptionType.Number, hasSensitiveValue: false },
			analyticsLogFile: { type: OptionType.String, hasSensitiveValue: true },
			disableAnalytics: { type: OptionType.Boolean, hasSensitiveValue: false },
			cleanupLogFile: { type: OptionType.String, hasSensitiveValue: true },
			hooks: {
				type: OptionType.Boolean,
				default: true,
				hasSensitiveValue: false,
			},
			link: {
				type: OptionType.Boolean,
				default: false,
				hasSensitiveValue: false,
			},
			gradlePath: { type: OptionType.String, hasSensitiveValue: false },
			gradleArgs: { type: OptionType.String, hasSensitiveValue: false },
			androidHost: { type: OptionType.String, hasSensitiveValue: false },
			androidHostModule: {
				type: OptionType.String,
				hasSensitiveValue: false,
				default: APP_FOLDER_NAME,
			},
			aab: { type: OptionType.Boolean, hasSensitiveValue: false },
			performance: { type: OptionType.Object, hasSensitiveValue: true },
			appleApplicationSpecificPassword: {
				type: OptionType.String,
				hasSensitiveValue: true,
			},
			appleSessionBase64: { type: OptionType.String, hasSensitiveValue: true },
			jar: { type: OptionType.String, hasSensitiveValue: true },
			aar: { type: OptionType.String, hasSensitiveValue: true },
			filter: { type: OptionType.String, hasSensitiveValue: true },
			git: {
				type: OptionType.Boolean,
				hasSensitiveValue: false,
				default: true,
			},
			dryRun: { type: OptionType.Boolean, hasSensitiveValue: false },
		};
	}

	private get optionNames(): string[] {
		return _.keys(this.options);
	}

	private getOptionValue(optionName: string): any {
		optionName = this.getCorrectOptionName(optionName);
		return this.argv[optionName];
	}

	public validateOptions(
		commandSpecificDashedOptions?: IDictionary<IDashedOption>
	): void {
		this.setupOptions(commandSpecificDashedOptions);
		const parsed: any = {};
		for (const key of Object.keys(this.argv)) {
			const optionName = `${this.argv[key]}`;
			parsed[optionName] = this.getOptionValue(optionName);
		}

		_.each(parsed, (value: any, originalOptionName: string) => {
			// when this.options are passed to yargs, it returns all of them and the ones that are not part of process.argv are set to undefined.
			if (value === undefined) {
				return;
			}

			const optionName = this.getCorrectOptionName(originalOptionName);

			if (!_.includes(this.optionsWhiteList, optionName)) {
				if (!this.isOptionSupported(optionName)) {
					this.$errors.failWithHelp(
						`The option '${originalOptionName}' is not supported.`
					);
				}

				const optionType = this.getOptionType(optionName),
					optionValue = parsed[optionName];

				if (_.isArray(optionValue) && optionType !== OptionType.Array) {
					this.$errors.failWithHelp(
						"The '%s' option requires a single value.",
						originalOptionName
					);
				} else if (
					optionType === OptionType.String &&
					helpers.isNullOrWhitespace(optionValue)
				) {
					this.$errors.failWithHelp(
						"The option '%s' requires non-empty value.",
						originalOptionName
					);
				} else if (
					optionType === OptionType.Array &&
					optionValue.length === 0
				) {
					this.$errors.failWithHelp(
						`The option '${originalOptionName}' requires one or more values, separated by a space.`
					);
				}
			}
		});
	}

	private getCorrectOptionName(optionName: string): string {
		const secondaryOptionName = this.getNonDashedOptionName(optionName);
		return _.includes(this.optionNames, secondaryOptionName)
			? secondaryOptionName
			: optionName;
	}

	private getOptionType(optionName: string): string {
		const option =
			this.options[optionName] || this.tryGetOptionByAliasName(optionName);
		return option ? option.type : "";
	}

	private tryGetOptionByAliasName(aliasName: string) {
		const option = _.find(this.options, (opt) => opt.alias === aliasName);
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
		const matchUpperCaseLetters = optionName.match(
			Options.NONDASHED_OPTION_REGEX
		);
		if (matchUpperCaseLetters) {
			// get here if option with upperCase letter is specified, for example profileDir
			// check if in knownOptions we have its kebabCase presentation
			const secondaryOptionName =
				matchUpperCaseLetters[1] +
					matchUpperCaseLetters[2].toUpperCase() +
					matchUpperCaseLetters[3] || "";
			return this.getNonDashedOptionName(secondaryOptionName);
		}

		return optionName;
	}

	private getDashedOptionName(optionName: string): string {
		const matchUpperCaseLetters = optionName.match(Options.DASHED_OPTION_REGEX);
		if (matchUpperCaseLetters) {
			const secondaryOptionName = `${
				matchUpperCaseLetters[1]
			}-${matchUpperCaseLetters[2].toLowerCase()}${
				matchUpperCaseLetters[3] || ""
			}`;
			return this.getDashedOptionName(secondaryOptionName);
		}

		return optionName;
	}

	private setArgv(): void {
		const opts: IDictionary<IDashedOption> = <IDictionary<IDashedOption>>{};
		_.each(this.options, (value: IDashedOption, key: string) => {
			opts[this.getDashedOptionName(key)] = value;
		});

		const parsed = yargs(hideBin(process.argv))
			.version(false)
			.help(false)
			.completion("completion_generate_script", async (current_, argv) => {
				const args: string[] = argv._.slice(1);
				const commands = injector
					.getRegisteredCommandsNames(false)
					.filter((c) => c != "/?"); // remove the /? command, looks weird... :D
				const currentDepth = args.length > 0 ? args.length - 1 : 0;
				const current = current_ ?? args[currentDepth] ?? "";
				// split all commands into their components ie. "device|list" => ["device", "list"]
				const matchGroups = commands.map((c) => c.split("|"));
				// find all commands that match the current depth and all the previous args
				const possibleMatches = matchGroups.filter((group) => {
					return group.slice(0, currentDepth).every((g, i) => {
						return g === args[i] || args[i].at(0) === "-";
					});
				});
				// filter out duplicates
				const completions = [
					...new Set(
						possibleMatches
							.map((match) => {
								return match[currentDepth];
							})
							.filter(Boolean)
					),
				];

				// autocomplete long -- options
				if (current.startsWith("--")) {
					return this.optionNames.filter((o) => o !== "_").map((o) => `--${o}`);
				}

				// autocomple short - options
				if (current.startsWith("-")) {
					return this.shorthands.map((o) => `-${o}`);
				}

				// autocomplete matched completions
				return completions;
			});
		this.initialArgv = parsed.argv as any;
		this.argv = parsed.options(<any>opts).argv as any;

		// For backwards compatibility
		// Previously profileDir had a default option and calling `this.$options.profileDir` always returned valid result.
		// Now the profileDir should be used from $settingsService, but ensure the `this.$options.profileDir` returns the same value.
		this.$settingsService.setSettings({
			profileDir: <string>this.argv.profileDir,
		});
		this.argv.profileDir = this.argv["profile-dir"] =
			this.$settingsService.getProfileDir();

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

		// alias --simulator to --emulator
		if (this.argv.simulator) {
			this.argv.emulator = this.argv.simulator;
		}

		this.argv.bundle = "webpack";

		this.adjustDashedOptions();
	}

	private adjustDashedOptions(): void {
		_.each(this.optionNames, (optionName) => {
			Object.defineProperty(Options.prototype, optionName, {
				configurable: true,
				get: () => {
					return this.getOptionValue(optionName);
				},
				set: (value: any) => {
					this.argv[optionName] = value;
				},
			});
		});
	}
}
injector.register("options", Options);
