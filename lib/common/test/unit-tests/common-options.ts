import { Errors } from "../../errors";
import { Yok } from "../../yok";
import { assert } from "chai";
import { OptionsBase } from "../../options";

let isExecutionStopped = false;

const knownOpts = {
	"path1": { type: OptionType.String },
	"help": { type: OptionType.Boolean },
	"verbose": { type: OptionType.Boolean, alias: "v" },
	"profileDir": { type: OptionType.String },
	"someDashedValue": { type: OptionType.String },
	"aBCDEFG": { type: OptionType.String },
	"arr": { type: OptionType.Array },
	"specialDashedV": { type: OptionType.Boolean }
};

function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("options", {});
	testInjector.register("staticConfig", {
		CLIENT_NAME: ""
	});
	testInjector.register("hostInfo", {});
	testInjector.register("settingsService", {
		setSettings: (settings: IConfigurationSettings): any => undefined,
		getProfileDir: () => "profileDir"
	});

	return testInjector;
}

function createOptions(testInjector: IInjector): ICommonOptions {
	const options = testInjector.resolve(OptionsBase, { options: knownOpts, defaultProfileDir: "1" }); // Validation is triggered in options's constructor
	return options;
}

describe("common options", () => {
	let testInjector: IInjector;
	beforeEach(() => {
		testInjector = createTestInjector();

		const errors = new Errors(testInjector);
		errors.failWithoutHelp = <any>((message: string, ...args: any[]): void => {
			isExecutionStopped = true;
		});
		errors.fail = <any>((message: string, ...args: any[]): void => {
			isExecutionStopped = true;
		});

		testInjector.register("errors", errors);
		isExecutionStopped = false;
	});

	describe("validateOptions", () => {
		it("breaks execution when option is not valid", () => {
			process.argv.push('--pathr');
			process.argv.push("incorrect argument");
			const options = createOptions(testInjector);
			options.validateOptions();
			process.argv.pop();
			process.argv.pop();
			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option does not have value", () => {
			process.argv.push('--path1');
			// If you do not pass value to an option, it's automatically set as true.
			const options = createOptions(testInjector);
			process.argv.pop();
			options.validateOptions();
			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid dashed option passed without dashes does not have value", () => {
			process.argv.push('--someDashedValue');
			// If you do not pass value to a string option, it's automatically set to "".
			const options = createOptions(testInjector);
			process.argv.pop();
			options.validateOptions();
			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid dashed option does not have value", () => {
			process.argv.push('--some-dashed-value');
			// If you do not pass value to an option, it's automatically set as true.
			const options = createOptions(testInjector);
			process.argv.pop();
			options.validateOptions();
			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid option has correct value", () => {
			process.argv.push('--path1');
			process.argv.push("SomeDir");
			const options = createOptions(testInjector);
			options.validateOptions();
			process.argv.pop();
			process.argv.pop();
			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has empty string value", () => {
			process.argv.push('--path');
			const options = createOptions(testInjector);
			options.validateOptions();
			process.argv.pop();
			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has value with spaces only", () => {
			process.argv.push('--path');
			process.argv.push('  ');
			const options = createOptions(testInjector);
			options.validateOptions();
			process.argv.pop();
			process.argv.pop();
			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when shorthand option is not valid", () => {
			process.argv.push('-j');
			process.argv.push('incorrect shorthand');
			const options = createOptions(testInjector);
			options.validateOptions();
			process.argv.pop();
			process.argv.pop();
			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid shorthand option has correct value", () => {
			process.argv.push('-v');
			const options = createOptions(testInjector);
			options.validateOptions();
			process.argv.pop();
			assert.isFalse(isExecutionStopped);
			assert.isTrue(options.verbose);
		});

		// all numbers are changed to strings before calling validateOptions
		it("does not break execution when valid option has number value", () => {
			process.argv.push('--path');
			process.argv.push('1');
			const options = createOptions(testInjector);
			options.validateOptions();
			process.argv.pop();
			process.argv.pop();
			assert.isFalse(isExecutionStopped);
		});

		it("throws error when valid option has array value", () => {
			process.argv.push('--path');
			process.argv.push("value 1");
			process.argv.push('--path');
			process.argv.push("value 2");
			const options = createOptions(testInjector);
			options.validateOptions();
			process.argv.pop();
			process.argv.pop();
			process.argv.pop();
			process.argv.pop();
			assert.isTrue(isExecutionStopped);
		});

		it("converts string value to array when option type is array", () => {
			const options: any = createOptions(testInjector);
			process.argv.push("--test1");
			process.argv.push("value");
			options.validateOptions({ test1: { type: OptionType.Array } });
			process.argv.pop();
			process.argv.pop();
			assert.isFalse(isExecutionStopped);
			assert.deepEqual(["value"], <any>options["test1"]);
		});

		it("does not break execution when valid commandSpecificOptions are passed", () => {
			process.argv.push("--test1");
			process.argv.push("value");
			const options = createOptions(testInjector);
			options.validateOptions({ test1: { type: OptionType.String } });
			process.argv.pop();
			process.argv.pop();
			assert.isFalse(isExecutionStopped);
		});

		it("does not break execution when valid commandSpecificOptions are passed and user specifies globally valid option", () => {
			const options = createOptions(testInjector);
			process.argv.push("--version");
			options.validateOptions({ test1: { type: OptionType.String } });
			process.argv.pop();
			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid array option has value with length 0", () => {
			process.argv.push('--arr');
			const options = createOptions(testInjector);
			options.validateOptions();
			process.argv.pop();
			assert.isTrue(isExecutionStopped);
		});

		describe("when commandSpecificOptions are passed", () => {
			it("breaks execution when commandSpecificOptions are passed and user tries to use invalid option", () => {
				process.argv.push("--invalidOption");
				const options = testInjector.resolve(OptionsBase, { options: knownOpts });
				options.validateOptions({ test1: { type: OptionType.String } });
				process.argv.pop();
				assert.isTrue(isExecutionStopped);
			});

			it("does not break execution when commandSpecificOptions are passed and user tries to use option valid for CLI, but not for this command", () => {
				process.argv.push("--json");
				const options = testInjector.resolve(OptionsBase, { options: knownOpts });
				options.validateOptions({ test1: { type: OptionType.String } });
				process.argv.pop();
				assert.isFalse(isExecutionStopped);
			});

			it("uses profile-dir from yargs when it exists and commandSpecificOptions are passed", () => {
				const expectedProfileDir = "TestDir";
				process.argv.push("--profile-dir");
				process.argv.push(expectedProfileDir);
				const settingsService = testInjector.resolve<ISettingsService>("settingsService");
				let valuePassedToSetSettings: string;
				settingsService.setSettings = (settings: IConfigurationSettings): any => {
					valuePassedToSetSettings = settings.profileDir;
				};

				settingsService.getProfileDir = () => valuePassedToSetSettings;
				const options = testInjector.resolve(OptionsBase, { options: knownOpts });
				options.validateOptions({ test1: { type: OptionType.String } });
				assert.equal(options.profileDir, expectedProfileDir);
				process.argv.pop();
				process.argv.pop();
				assert.isFalse(isExecutionStopped);
			});
		});

		// when you pass --option with dash, yargs adds it to yargs.argv in two ways:
		// for ex. '$ appbuilder login --profile-dir "some dir"' will add profile dir to yargs.argv as: profileDir and profile-dir
		describe("validates dashed options correctly", () => {
			it("does not break execution when dashed option with single dash is passed", () => {
				process.argv.push("profile-dir");
				process.argv.push("some dir");
				const options = createOptions(testInjector);
				options.validateOptions();
				process.argv.pop();
				process.argv.pop();
				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (profile-dir) are added to yargs.argv in two ways: profile-dir and profileDir");
			});

			it("does not break execution when dashed option with two dashes is passed", () => {
				process.argv.push("some-dashed-value");
				process.argv.push("some dir");
				const options = createOptions(testInjector);
				options.validateOptions();
				process.argv.pop();
				process.argv.pop();
				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (some-dashed-value) are added to yargs.argv in two ways: some-dashed-value and someDashedValue");
			});

			it("does not break execution when dashed option with a lot of dashes is passed", () => {
				process.argv.push("a-b-c-d-e-f-g");
				process.argv.push("some dir");
				const options = createOptions(testInjector);
				options.validateOptions();

				process.argv.pop();
				process.argv.pop();
				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (a-b-c-d-e-f-g) are added to yargs.argv in two ways: a-b-c-d-e-f-g and aBCDEFG.");
			});

			it("does not break execution when dashed option with two dashes is passed", () => {
				process.argv.push("--special-dashed-v");
				const options = createOptions(testInjector);
				options.validateOptions();
				process.argv.pop();
				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (special-dashed-v) are added to yargs.argv in two ways: special-dashed-v and specialDashedV");
			});

		});
	});
});

function createOptionsWithProfileDir(defaultProfileDir?: string): ICommonOptions {
	const testInjector = new Yok();
	testInjector.register("errors", {});
	testInjector.register("staticConfig", {});
	let valuePassedToSetSettings: string;
	testInjector.register("settingsService", {
		setSettings: (settings: IConfigurationSettings): any => {
			valuePassedToSetSettings = settings.profileDir;
		},
		getProfileDir: () => valuePassedToSetSettings || defaultProfileDir
	});

	const options = testInjector.resolve(OptionsBase, { options: {} });
	return options;
}

describe("common options profile-dir tests", () => {
	describe("setProfileDir", () => {

		it("uses profile-dir from yargs when it exists", () => {
			const expectedProfileDir = "TestDir";
			process.argv.push("--profile-dir");
			process.argv.push(expectedProfileDir);
			const options = createOptionsWithProfileDir();
			options.validateOptions();
			process.argv.pop();
			process.argv.pop();
			assert.equal(options.profileDir, expectedProfileDir);
		});

		it("sets default profile-dir when it is not passed on command line", () => {
			const profileDir = "TestDir";
			const options = createOptionsWithProfileDir(profileDir);
			options.validateOptions();
			assert.equal(options.profileDir, profileDir);
		});

		it("uses profile-dir from yargs when it exists even if default one has non-empty value", () => {
			const expectedProfileDir = "TestDir";
			process.argv.push("--profile-dir");
			process.argv.push(expectedProfileDir);
			const options = createOptionsWithProfileDir();
			options.validateOptions();
			process.argv.pop();
			process.argv.pop();
			assert.equal(options.profileDir, expectedProfileDir);
		});

		it("uses profileDir from yargs when it exists", () => {
			const expectedProfileDir = "TestDir";
			process.argv.push("--profileDir");
			process.argv.push(expectedProfileDir);
			const options = createOptionsWithProfileDir();
			options.validateOptions();
			process.argv.pop();
			process.argv.pop();
			assert.equal(options.profileDir, expectedProfileDir);
		});
	});
});
