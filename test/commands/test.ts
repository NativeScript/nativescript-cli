import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { Options } from "../../lib/options";
import { TestIosCommand } from "../../lib/commands/test";
import { IOptions } from "../../lib/declarations";
import { ICommand } from "../../lib/common/definitions/commands";
import { IInjector } from "../../lib/common/definitions/yok";
import { IConfigurationSettings } from "../../lib/common/declarations";

const CI_ENVIRONMENT_VARIABLES = ["CI", "JENKINS_HOME"];

function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("settingsService", {
		setSettings: (settings: IConfigurationSettings): any => undefined,
		getProfileDir: () => "profileDir",
	});
	testInjector.register("errors", {
		fail: (message: string): never => {
			throw new Error(message);
		},
		failWithHelp: (message: string): never => {
			throw new Error(message);
		},
	});
	testInjector.register("logger", {
		warn: (message: string): void => undefined,
	});

	testInjector.register("projectData", {});
	testInjector.register("testExecutionService", {});
	testInjector.register("vitestExecutionService", {});
	testInjector.register("analyticsService", {});
	testInjector.register("platformEnvironmentRequirements", {});
	testInjector.register("cleanupService", {});
	testInjector.register("liveSyncCommandHelper", {});
	testInjector.register("devicesService", {});
	testInjector.register("migrateController", {});

	return testInjector;
}

interface IResolvedTestCommand {
	command: ICommand;
	options: IOptions;
}

function resolveTestIosCommand(): IResolvedTestCommand {
	const testInjector = createTestInjector();
	const options = testInjector.resolve(Options);
	testInjector.register("options", options);
	testInjector.registerCommand("test|ios", TestIosCommand);
	const command = testInjector.resolveCommand("test|ios");
	return { command, options };
}

function validateWithArgs(
	resolved: IResolvedTestCommand,
	args: string[] = [],
): void {
	args.forEach((arg) => process.argv.push(arg));
	resolved.options.validateOptions(resolved.command.dashedOptions);
	args.forEach(() => process.argv.pop());
}

describe("test ios command", () => {
	const savedCiEnvironment: { [key: string]: string } = {};

	beforeEach(() => {
		CI_ENVIRONMENT_VARIABLES.forEach((name) => {
			savedCiEnvironment[name] = process.env[name];
			delete process.env[name];
		});
	});

	afterEach(() => {
		CI_ENVIRONMENT_VARIABLES.forEach((name) => {
			if (savedCiEnvironment[name] === undefined) {
				delete process.env[name];
			} else {
				process.env[name] = savedCiEnvironment[name];
			}
		});
	});

	describe("--watch option", () => {
		it("defaults to off in CI environments", () => {
			process.env.CI = "true";
			const resolved = resolveTestIosCommand();
			validateWithArgs(resolved);
			assert.isFalse(resolved.options.argv.watch);
		});

		it("defaults to off when JENKINS_HOME is set", () => {
			process.env.JENKINS_HOME = "/var/jenkins";
			const resolved = resolveTestIosCommand();
			validateWithArgs(resolved);
			assert.isFalse(resolved.options.argv.watch);
		});

		it("defaults to on outside CI environments", () => {
			const resolved = resolveTestIosCommand();
			validateWithArgs(resolved);
			assert.isTrue(resolved.options.argv.watch);
		});

		it("stays on when --watch is passed explicitly in CI", () => {
			process.env.CI = "true";
			const resolved = resolveTestIosCommand();
			validateWithArgs(resolved, ["--watch"]);
			assert.isTrue(resolved.options.argv.watch);
		});

		it("stays off when --no-watch is passed outside CI", () => {
			const resolved = resolveTestIosCommand();
			validateWithArgs(resolved, ["--no-watch"]);
			assert.isFalse(resolved.options.argv.watch);
		});
	});
});
