import { assert } from "chai";
import { Yok } from "../lib/common/yok";
import { CommandsService } from "../lib/common/services/commands-service";
import { ICommand } from "../lib/common/definitions/commands";
import { OptionType } from "../lib/common/enums";

interface ITestSetup {
	injector: Yok;
	validatedWith: { called: boolean; allowUnknown?: boolean };
}

function createTestInjector(command: ICommand): ITestSetup {
	const injector = new Yok();
	const validatedWith: { called: boolean; allowUnknown?: boolean } = {
		called: false,
	};

	injector.register("errors", {
		fail: (message: string): void => {
			throw new Error(message);
		},
		failWithHelp: (message: string): void => {
			throw new Error(message);
		},
	});
	injector.register("hooksService", {});
	injector.register("logger", { warn: (): void => undefined });
	injector.register("options", {
		validateOptions: (dashedOptions: any, allowUnknown?: boolean): void => {
			validatedWith.called = true;
			validatedWith.allowUnknown = allowUnknown;
		},
	});
	injector.register("staticConfig", {});
	injector.register("extensibilityService", {});
	injector.register("optionsTracker", {});

	injector.resolveCommand = () => command;

	return { injector, validatedWith };
}

/** What an in-process dispatch touched, recorded off the collaborators. */
interface IDispatchRecord {
	primedWith: { dashedOptions: any; allowUnknown?: boolean }[];
	hooks: string[];
	analytics: string[];
	executed: string[][];
	postCommandActions: string[][];
	reported: any[];
	helpSuggestions: number;
}

const cliOption = { type: OptionType.Boolean, hasSensitiveValue: false };

function createDispatchInjector(command: ICommand): {
	injector: Yok;
	record: IDispatchRecord;
	options: any;
	initialArgv: any;
} {
	const injector = new Yok();
	const record: IDispatchRecord = {
		primedWith: [],
		hooks: [],
		analytics: [],
		executed: [],
		postCommandActions: [],
		reported: [],
		helpSuggestions: 0,
	};

	const initialArgv: any = { watch: true };
	const options: any = {
		options: { watch: cliOption },
		argv: initialArgv,
		validateOptions(dashedOptions: any, allowUnknown?: boolean): void {
			record.primedWith.push({ dashedOptions, allowUnknown });
			// The real parser merges the command's declarations into the shared
			// table and re-parses, replacing both.
			this.options = { ...this.options, ...dashedOptions };
			this.argv = { ...this.argv, watch: false };
		},
	};

	injector.register("errors", {
		fail: (message: string): never => {
			throw new Error(message);
		},
		failWithHelp: (message: string): never => {
			throw new Error(message);
		},
		beginCommand: (): Promise<boolean> => {
			throw new Error(
				"beginCommand exits the process; an in-process dispatch must not use it.",
			);
		},
		reportCommandError: async (
			error: any,
			printCommandHelp: () => Promise<void>,
		): Promise<void> => {
			record.reported.push(error);
			await printCommandHelp();
		},
	});
	injector.register("hooksService", {
		executeBeforeHooks: async (name: string): Promise<void> => {
			record.hooks.push(`before:${name}`);
		},
		executeAfterHooks: async (name: string): Promise<void> => {
			record.hooks.push(`after:${name}`);
		},
	});
	injector.register("logger", {
		warn: (): void => undefined,
		error: (): void => undefined,
		printMarkdown: (): void => {
			record.helpSuggestions++;
		},
	});
	injector.register("options", options);
	injector.register("staticConfig", {});
	injector.register("extensibilityService", {});
	injector.register("optionsTracker", {
		trackOptions: async (): Promise<void> => {
			record.analytics.push("options");
		},
	});
	injector.register("analyticsService", {
		checkConsent: async (): Promise<void> => {
			record.analytics.push("consent");
		},
		trackInGoogleAnalytics: async (): Promise<void> => {
			record.analytics.push("pageview");
		},
	});

	injector.resolveCommand = () => command;
	injector.buildHierarchicalCommand = (): any => null;
	injector.isValidHierarchicalCommand = async (): Promise<boolean> => false;

	return { injector, record, options, initialArgv };
}

/** A command shaped the way the definition adapter compiles one. */
function definedCommand(
	record: IDispatchRecord,
	overrides: Partial<ICommand> = {},
): ICommand {
	return {
		allowedParameters: [],
		dashedOptions: { watch: { ...cliOption, default: false } },
		canExecute: async (): Promise<boolean> => true,
		execute: async (args: string[]): Promise<void> => {
			record.executed.push(args);
		},
		...overrides,
	};
}

describe("commands-service", () => {
	describe("option validation", () => {
		const baseCommand: ICommand = {
			execute: async (): Promise<void> => undefined,
			allowedParameters: [],
			canExecute: async (): Promise<boolean> => true,
		};

		it("validates the options of an ordinary command", async () => {
			const { injector, validatedWith } = createTestInjector(baseCommand);
			const service = injector.resolve(CommandsService);

			await (<any>service).tryExecuteCommandAction("info", []);

			assert.isTrue(validatedWith.called);
		});

		it("tolerates unknown options for a command that forwards them", async () => {
			const { injector, validatedWith } = createTestInjector({
				...baseCommand,
				allowUnknownOptions: true,
			});
			const service = injector.resolve(CommandsService);

			await (<any>service).tryExecuteCommandAction("preview", []);

			// Validation still runs so the command's own options are merged;
			// only the rejection of foreign flags is suppressed.
			assert.isTrue(validatedWith.called);
			assert.isTrue(validatedWith.allowUnknown);
		});
	});

	describe("executeCommandInProcess", () => {
		it("primes the command's declared options before it runs", async () => {
			const { injector, record } = createDispatchInjector(null);
			const command = definedCommand(record, { allowUnknownOptions: true });
			injector.resolveCommand = () => command;
			const service = injector.resolve(CommandsService);

			await service.executeCommandInProcess("open|ios");

			assert.deepEqual(record.primedWith, [
				{ dashedOptions: command.dashedOptions, allowUnknown: true },
			]);
			assert.deepEqual(record.executed, [[]]);
		});

		it("hands the parser back the state the host process was running on", async () => {
			const { injector, record, options, initialArgv } =
				createDispatchInjector(null);
			injector.resolveCommand = () => definedCommand(record);
			const service = injector.resolve(CommandsService);

			await service.executeCommandInProcess("open|ios");

			assert.deepEqual(options.options, { watch: cliOption });
			assert.strictEqual(options.argv, initialArgv);
		});

		it("restores the parser even when the command fails", async () => {
			const { injector, record, options, initialArgv } =
				createDispatchInjector(null);
			injector.resolveCommand = () =>
				definedCommand(record, {
					execute: async (): Promise<void> => {
						throw new Error("boom");
					},
				});
			const service = injector.resolve(CommandsService);

			await assert.isRejected(service.executeCommandInProcess("open|ios"));

			assert.deepEqual(options.options, { watch: cliOption });
			assert.strictEqual(options.argv, initialArgv);
		});

		it("refuses a command whose canExecute says no", async () => {
			const { injector, record } = createDispatchInjector(null);
			injector.resolveCommand = () =>
				definedCommand(record, {
					canExecute: async (): Promise<boolean> => false,
				});
			const service = injector.resolve(CommandsService);

			await assert.isRejected(
				service.executeCommandInProcess("open|ios"),
				"Command 'open|ios' cannot be executed.",
			);

			assert.deepEqual(record.executed, []);
		});

		it("enforces the arguments policy of a command without canExecute", async () => {
			const { injector, record } = createDispatchInjector(null);
			injector.resolveCommand = () =>
				definedCommand(record, { canExecute: undefined });
			const service = injector.resolve(CommandsService);

			await assert.isRejected(
				service.executeCommandInProcess("open|ios", ["extra"]),
				"This command doesn't accept parameters.",
			);

			assert.deepEqual(record.executed, []);
		});

		it("runs postCommandAction after the command", async () => {
			const { injector, record } = createDispatchInjector(null);
			injector.resolveCommand = () =>
				definedCommand(record, {
					postCommandAction: async (args: string[]): Promise<void> => {
						record.postCommandActions.push(args);
					},
				});
			const service = injector.resolve(CommandsService);

			await service.executeCommandInProcess("install", ["lodash"]);

			assert.deepEqual(record.executed, [["lodash"]]);
			assert.deepEqual(record.postCommandActions, [["lodash"]]);
		});

		it("throws the failure at the caller instead of exiting", async () => {
			const { injector, record } = createDispatchInjector(null);
			const failure = new Error("Unable to open the project.");
			injector.resolveCommand = () =>
				definedCommand(record, {
					execute: async (): Promise<void> => {
						throw failure;
					},
				});
			const service = injector.resolve(CommandsService);

			let raised: Error = null;
			try {
				await service.executeCommandInProcess("open|ios");
			} catch (err) {
				raised = err;
			}

			assert.strictEqual(raised, failure);
			assert.deepEqual(record.reported, [failure]);
		});

		it("reports an unknown command the way a typed one is", async () => {
			const { injector, record } = createDispatchInjector(null);
			injector.resolveCommand = (): ICommand => null;
			const service = injector.resolve(CommandsService);

			await assert.isRejected(
				service.executeCommandInProcess("nope"),
				"Unknown command 'nope'.",
			);

			assert.equal(record.reported.length, 1);
			assert.equal(record.helpSuggestions, 1);
		});

		it("runs the command once per dispatch", async () => {
			const { injector, record } = createDispatchInjector(null);
			injector.resolveCommand = () => definedCommand(record);
			const service = injector.resolve(CommandsService);

			await service.executeCommandInProcess("open|ios");
			await service.executeCommandInProcess("open|ios");

			assert.deepEqual(record.executed, [[], []]);
			assert.equal(record.primedWith.length, 2);
		});

		it("runs hooks, and leaves analytics to the command line", async () => {
			const { injector, record } = createDispatchInjector(null);
			injector.resolveCommand = () => definedCommand(record);
			const service = injector.resolve(CommandsService);

			await service.executeCommandInProcess("open|ios");

			assert.deepEqual(record.hooks, ["before:open|ios", "after:open|ios"]);
			assert.deepEqual(record.analytics, []);
		});
	});
});
