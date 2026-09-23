import { assert } from "chai";
import { spawnSync } from "child_process";
import * as path from "path";
import { getRootInjector, Yok } from "../lib/common/yok";
import { IInjector } from "../lib/common/definitions/yok";
import {
	inject,
	InjectionToken,
	runInInjectionContext,
} from "../lib/common/di";
import { COMMAND_CONTEXT } from "../lib/common/contracts/command-context";
import { CliOptions } from "../lib/common/contracts/cli-options";
import { COMMAND_PRECONDITIONS } from "../lib/common/contracts/command-preconditions";
import {
	COMMAND_OWNER,
	CommandRegistry,
	DeferredCommandResult,
} from "../lib/common/contracts/command-registry";
import { CommandsService as CommandsServiceContract } from "../lib/common/contracts/commands-service";
import { CommandsService } from "../lib/common/services/commands-service";
import { Options } from "../lib/options";
import { Errors } from "../lib/common/errors";
import { LoggerStub, HooksServiceStub } from "./stubs";
import {
	CommandContext,
	arrayOption,
	booleanOption,
	Command,
	defineCommand,
	defineOptions,
	isCommandClass,
	isCommandDefinition,
	isOptionsGroup,
	numberOption,
	OPTIONS_GROUP_MARKER,
	stringOption,
} from "../lib/common/define-command";
import {
	createCommandFromDefinition,
	registerBuiltInCommand,
	registerCommand,
	registerLazyCommand,
} from "../lib/common/services/command-definition-adapter";
import type { KeyShortcut } from "../lib/common/contracts/key-shortcuts";

const createTestInjector = (options: any = {}): IInjector => {
	const testInjector = new Yok();
	testInjector.register("options", options);
	testInjector.register("logger", LoggerStub);
	testInjector.register("errors", {
		failWithHelp: (message: string) => {
			throw new Error(message);
		},
	});
	return testInjector;
};

describe("defineCommand", () => {
	it("marks definitions so a duplicated CLI copy still recognises them", () => {
		const definition = defineCommand({
			name: "dctest-marker",
			run: (): void => undefined,
		});

		assert.isTrue(isCommandDefinition(definition));
		assert.isTrue(
			(<any>definition)[Symbol.for("nativescript:cli:commandDefinition")],
		);
		assert.isFalse(isCommandDefinition({ name: "dctest-marker" }));
		assert.isFalse(isCommandDefinition(null));
	});

	it("keeps the marker on a spread-derived copy", () => {
		const derived = {
			...defineCommand({ name: "dctest-spread", run: (): void => undefined }),
			name: "dctest-spread-derived",
		};

		assert.isTrue(isCommandDefinition(derived));
	});

	describe("define-time validation", () => {
		const rejects = (definition: any, expected: RegExp) =>
			assert.throws(() => defineCommand(definition), expected);

		it("names the command and the accepted form in every message", () => {
			rejects(
				{ name: "dctest-bad", run: 42 },
				/Invalid command definition for 'dctest-bad'.*'run' must be a function.*Accepted form: defineCommand/s,
			);
		});

		it("rejects a missing or unusable name", () => {
			rejects(
				{ run: (): void => undefined },
				/an unnamed command.*'name' must be/s,
			);
			rejects({ name: "", run: (): void => undefined }, /'name' must be/);
			rejects({ name: [], run: (): void => undefined }, /'name' must be/);
			rejects(
				{ name: ["ok", ""], run: (): void => undefined },
				/'name' must be/,
			);
			rejects({ name: 7, run: (): void => undefined }, /'name' must be/);
		});

		it("rejects a missing run", () => {
			rejects({ name: "dctest-norun" }, /'run' must be a function/);
		});

		it("rejects a typo'd definition field", () => {
			rejects(
				{
					name: "dctest-typo",
					handler: (): void => undefined,
					run: (): void => undefined,
				},
				/unknown field\(s\) 'handler'/,
			);
		});

		it("rejects an unusable params policy", () => {
			rejects(
				{ name: "dctest-args", params: "one", run: (): void => undefined },
				/'params' is 'one'; it must be "none", "any" or an array of param specs/,
			);
		});

		it("points a stale 'arguments' field at 'params'", () => {
			rejects(
				{
					name: "dctest-args-old",
					arguments: "any",
					run: (): void => undefined,
				},
				/'arguments' is not a field; positional parameters are declared under 'params'/,
			);
		});

		it("rejects an option that is both required and defaulted", () => {
			rejects(
				{
					name: "dctest-required-default",
					options: {
						device: stringOption(<any>{ required: true, default: "x" }),
					},
					run: (): void => undefined,
				},
				/option 'device' is required and has a default/,
			);
		});

		it("rejects a non-function canExecute and non-boolean flags", () => {
			rejects(
				{ name: "dctest-can", canExecute: true, run: (): void => undefined },
				/'canExecute' must be a function/,
			);
			rejects(
				{
					name: "dctest-flag",
					disableAnalytics: "yes",
					run: (): void => undefined,
				},
				/'disableAnalytics' must be a boolean/,
			);
			rejects(
				{ name: "dctest-flag2", enableHooks: 1, run: (): void => undefined },
				/'enableHooks' must be a boolean/,
			);
		});

		it("rejects an option with an unsupported type", () => {
			rejects(
				{
					name: "dctest-opt",
					options: { verbose: { type: "bool" } },
					run: (): void => undefined,
				},
				/option 'verbose' has type 'bool'; the supported types are boolean, string, number, array/,
			);
		});

		it("rejects an option that is not a spec at all", () => {
			rejects(
				{
					name: "dctest-opt2",
					options: { verbose: true },
					run: (): void => undefined,
				},
				/option 'verbose' must be declared with one of booleanOption/,
			);
		});

		it("rejects a typo'd option-spec field", () => {
			rejects(
				{
					name: "dctest-opt3",
					options: { verbose: { type: "boolean", describe: "no" } },
					run: (): void => undefined,
				},
				/option 'verbose' has unknown field\(s\) 'describe'/,
			);
		});

		it("rejects unusable alias, hasSensitiveValue and description entries", () => {
			rejects(
				{
					name: "dctest-opt4",
					options: { verbose: { type: "boolean", alias: 1 } },
					run: (): void => undefined,
				},
				/option 'verbose' declares an 'alias'/,
			);
			rejects(
				{
					name: "dctest-opt5",
					options: { verbose: { type: "boolean", hasSensitiveValue: "yes" } },
					run: (): void => undefined,
				},
				/non-boolean 'hasSensitiveValue'/,
			);
			rejects(
				{
					name: "dctest-opt6",
					options: { verbose: { type: "boolean", description: 5 } },
					run: (): void => undefined,
				},
				/non-string 'description'/,
			);
		});

		it("accepts every documented field", () => {
			assert.doesNotThrow(() =>
				defineCommand({
					name: ["dctest-full", "dctest-full-alias"],
					description: "Everything at once",
					options: {
						verbose: booleanOption({ default: false }),
						output: stringOption({ alias: ["o", "out"], description: "Dir" }),
						retries: numberOption({ default: 1 }),
						files: arrayOption({ hasSensitiveValue: true }),
					},
					params: "any",
					canExecute: () => true,
					disableAnalytics: true,
					enableHooks: false,
					run: (): void => undefined,
				}),
			);
		});
	});

	describe("option value types", () => {
		it("types default-less options as possibly undefined", () => {
			// The repo builds without strictNullChecks, which erases the very
			// `| undefined` under test, so the assertions live in their own
			// strict project.
			const project = path.join(
				__dirname,
				"..",
				"..",
				"test",
				"type-fixtures",
				"tsconfig.json",
			);
			const result = spawnSync(
				process.execPath,
				[require.resolve("typescript/bin/tsc"), "-p", project],
				{ encoding: "utf8" },
			);

			// define-command.ts reaches the DI types, which drag in most of the
			// repo — none of which was ever strict-clean. Only the fixture and the
			// module it pins are under test here.
			const underTest =
				/^(.*[\\/])?(define-command|define-command-types)\.ts\(/;
			const failures = `${result.stdout || ""}${result.stderr || ""}`
				.split(/\r?\n/)
				.filter((line) => /\.ts\(\d+,\d+\): error TS/.test(line))
				.filter((line) => underTest.test(line));

			assert.deepEqual(failures, []);
		});
	});

	describe("registration", () => {
		it("round-trips through the legacy command registry", () => {
			const definition = defineCommand({
				name: "dctestwidget|add",
				description: "Adds a widget",
				run: (): void => undefined,
			});

			const testInjector = createTestInjector();
			runInInjectionContext(testInjector, () => registerCommand(definition));

			const command = testInjector.resolveCommand("dctestwidget|add");
			assert.isFunction(command.execute);
			assert.deepEqual(command.allowedParameters, []);

			const parent = testInjector.resolveCommand("dctestwidget");
			assert.isTrue(parent.isHierarchicalCommand);

			assert.include(
				testInjector.getRegisteredCommandsNames(false),
				"dctestwidget|add",
			);
		});

		it("caches one command instance per registered name", () => {
			const testInjector = createTestInjector();
			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({ name: "dctestflat", run: (): void => undefined }),
				),
			);

			assert.strictEqual(
				testInjector.resolveCommand("dctestflat"),
				testInjector.resolveCommand("dctestflat"),
			);
		});

		it("registers every alias of a multi-name definition", () => {
			const testInjector = createTestInjector();
			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: ["dctestalias", "dctestalias2"],
						run: (): void => undefined,
					}),
				),
			);

			assert.isFunction(testInjector.resolveCommand("dctestalias").execute);
			assert.isFunction(testInjector.resolveCommand("dctestalias2").execute);
		});

		it("defines a bare definition on the caller's behalf", () => {
			const testInjector = createTestInjector();

			runInInjectionContext(testInjector, () =>
				registerCommand({ name: "dctestraw", run: (): void => undefined }),
			);

			assert.isFunction(testInjector.resolveCommand("dctestraw").execute);
		});

		it("still validates a bare definition at registration", () => {
			assert.throws(
				() =>
					runInInjectionContext(createTestInjector(), () =>
						registerCommand(<any>{
							name: "dctestrawbad",
							run: "not a function",
						}),
					),
				/run/,
			);
		});

		it("registers through the CommandRegistry the target injector provides", () => {
			const testInjector = createTestInjector();
			const registered: string[] = [];
			testInjector.register({
				provide: CommandRegistry,
				useValue: {
					registerDeferredCommand: (name: string): DeferredCommandResult => {
						registered.push(name);
						return { registered: true };
					},
				},
			});

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: ["dctestfacet", "dctestfacet2"],
						run: (): void => undefined,
					}),
				),
			);

			assert.deepEqual(registered, ["dctestfacet", "dctestfacet2"]);
			assert.isNull(testInjector.resolveCommand("dctestfacet"));
		});

		it("refuses a subcommand that would shadow a registered command", () => {
			const testInjector = createTestInjector();
			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({ name: "dctestowned", run: (): void => undefined }),
				),
			);

			const result = runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctestowned|sub",
						run: (): void => undefined,
					}),
				),
			);

			assert.deepStrictEqual(result, {
				registered: false,
				rejection: { reason: "parent-is-command", parent: "dctestowned" },
			});

			const owner = testInjector.resolveCommand("dctestowned");
			assert.isUndefined(owner.isHierarchicalCommand);
			assert.isNull(testInjector.resolveCommand("dctestowned|sub"));

			const logger: LoggerStub = testInjector.resolve("logger");
			assert.isEmpty(logger.warnOutput);
		});

		it("registers against the injection context and takes its owner", async () => {
			const testInjector = createTestInjector();
			const scope = testInjector.createChild([
				{ provide: COMMAND_OWNER, useValue: "dctest-ambient-extension" },
			]);
			let seenInjector: any;
			const definition = defineCommand({
				name: "dctestambient",
				run: (ctx): void => {
					seenInjector = ctx.injector;
				},
			});

			assert.deepStrictEqual(
				runInInjectionContext(scope, () => registerCommand(definition)),
				{ registered: true },
			);

			await testInjector.resolveCommand("dctestambient").execute([]);
			assert.strictEqual(seenInjector.parent, scope);

			assert.deepStrictEqual(
				runInInjectionContext(testInjector, () =>
					registerLazyCommand<typeof definition>(
						"dctestambient",
						() => definition,
					),
				),
				{
					registered: false,
					rejection: {
						reason: "claimed",
						owner: "dctest-ambient-extension",
					},
				},
			);
		});
	});

	describe("execute", () => {
		it("passes args and the declared options through, inside an injection context", async () => {
			const testInjector = createTestInjector({
				quiet: true,
				output: "dist",
				undeclared: "ignored",
			});
			testInjector.register("dcTestGreeter", { greet: () => "hello" });

			let capturedArgs: string[];
			let capturedOptions: any;
			let greeting: string;

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestexec",
					options: {
						quiet: booleanOption(),
						output: stringOption(),
					},
					run(context) {
						greeting = inject<any>("dcTestGreeter").greet();
						capturedArgs = context.args;
						capturedOptions = context.options;
					},
				}),
				testInjector,
			);

			await command.execute(["one", "two"]);

			assert.deepEqual(capturedArgs, ["one", "two"]);
			assert.deepEqual(capturedOptions, { quiet: true, output: "dist" });
			assert.strictEqual(greeting, "hello");
		});

		it("reads option values at execution time", async () => {
			const optionsService: any = { quiet: false };
			const testInjector = createTestInjector(optionsService);

			let seen: boolean;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestlate",
					options: { quiet: booleanOption() },
					run: (context) => {
						seen = context.options.quiet;
					},
				}),
				testInjector,
			);

			optionsService.quiet = true;
			await command.execute([]);

			assert.isTrue(seen);
		});

		it("awaits an asynchronous run", async () => {
			const testInjector = createTestInjector();
			let finished = false;

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestasync",
					run: async () => {
						await new Promise((resolve) => setTimeout(resolve, 1));
						finished = true;
					},
				}),
				testInjector,
			);

			await command.execute([]);

			assert.isTrue(finished);
		});

		it("carries the declared option values onto the run context", async () => {
			const testInjector = createTestInjector({
				quiet: true,
				output: "dist",
				retries: 3,
				files: ["a.ts"],
			});

			let seen: any;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctesttypes",
					options: {
						quiet: booleanOption(),
						output: stringOption(),
						retries: numberOption(),
						files: arrayOption(),
					},
					run: (context) => {
						seen = context.options;
					},
				}),
				testInjector,
			);

			await command.execute([]);

			assert.deepEqual(seen, {
				quiet: true,
				output: "dist",
				retries: 3,
				files: ["a.ts"],
			});
		});
	});

	describe("shortcuts", () => {
		let savedSetting: string;

		beforeEach(() => {
			savedSetting = process.env.NS_COMMAND_SHORTCUTS;
			process.env.NS_COMMAND_SHORTCUTS = "true";
		});

		afterEach(() => {
			if (savedSetting === undefined) {
				delete process.env.NS_COMMAND_SHORTCUTS;
			} else {
				process.env.NS_COMMAND_SHORTCUTS = savedSetting;
			}
		});

		const restartEntry: KeyShortcut = {
			key: "r",
			description: "Restart",
			action: (): void => undefined,
		};

		const keyShortcutServiceStub = () => ({
			attached: <string[][]>[],
			hints: 0,
			attach(options: { shortcuts: KeyShortcut[] }): boolean {
				this.attached.push(options.shortcuts.map((shortcut) => shortcut.key));
				return true;
			},
			detach: (): void => undefined,
			printHelp: (): void => undefined,
			printHint(): void {
				this.hints++;
			},
		});

		it("attaches the declared table once run resolves", async () => {
			const testInjector = createTestInjector();
			const keyShortcutService = keyShortcutServiceStub();
			testInjector.register("keyShortcutService", keyShortcutService);

			let declaredWith: any[];
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-shortcuts",
					setup: () => ({ platform: "iOS" }),
					run: (): void => undefined,
					shortcuts: (context, setupResult) => {
						declaredWith = [context.args, setupResult];
						return [restartEntry];
					},
				}),
				testInjector,
			);

			await command.execute(["alpha"]);

			assert.deepEqual(keyShortcutService.attached, [["r"]]);
			assert.equal(keyShortcutService.hints, 1);
			assert.deepEqual(declaredWith, [["alpha"], { platform: "iOS" }]);
		});

		it("attaches nothing while NS_COMMAND_SHORTCUTS is off", async () => {
			delete process.env.NS_COMMAND_SHORTCUTS;
			const testInjector = createTestInjector();
			const keyShortcutService = keyShortcutServiceStub();
			testInjector.register("keyShortcutService", keyShortcutService);

			let declared = false;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-shortcuts-off",
					run: (): void => undefined,
					shortcuts: () => {
						declared = true;
						return [restartEntry];
					},
				}),
				testInjector,
			);

			await command.execute([]);

			assert.isFalse(declared);
			assert.deepEqual(keyShortcutService.attached, []);
			assert.equal(keyShortcutService.hints, 0);
		});

		it("attaches nothing when the table comes back empty", async () => {
			const testInjector = createTestInjector();
			const keyShortcutService = keyShortcutServiceStub();
			testInjector.register("keyShortcutService", keyShortcutService);

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-shortcuts-empty",
					run: (): void => undefined,
					shortcuts: () => [],
				}),
				testInjector,
			);

			await command.execute([]);

			assert.deepEqual(keyShortcutService.attached, []);
		});

		it("attaches nothing when the run is an in-process dispatch", async () => {
			const testInjector = new Yok();
			testInjector.register("errors", {
				beginCommand: async (action: () => Promise<boolean>) => action(),
				failWithHelp: (message: string) => {
					throw new Error(message);
				},
				fail: (message: string) => {
					throw new Error(message);
				},
				reportCommandError: async (ex: Error) => {
					throw ex;
				},
			});
			testInjector.register("hooksService", HooksServiceStub);
			testInjector.register("logger", LoggerStub);
			testInjector.register("staticConfig", {
				disableAnalytics: true,
				disableCommandHooks: true,
			});
			testInjector.register("extensibilityService", {});
			testInjector.register("optionsTracker", {});
			testInjector.register("options", {
				validateOptions: (): void => undefined,
			});
			testInjector.register("commandsService", CommandsService);
			const keyShortcutService = keyShortcutServiceStub();
			testInjector.register("keyShortcutService", keyShortcutService);

			let ran = false;
			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-shortcuts-in-process",
						run: () => {
							ran = true;
						},
						shortcuts: () => [restartEntry],
					}),
				),
			);

			const commandsService: ICommandsService =
				testInjector.resolve("commandsService");
			await commandsService.runCommand("dctest-shortcuts-in-process");

			assert.isTrue(ran);
			assert.deepEqual(keyShortcutService.attached, []);
			assert.isFalse(commandsService.isExecutingInProcess);
		});
	});

	describe("dashedOptions", () => {
		it("compiles the schema into the shape the option parser expects", () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestdashed",
					options: {
						quiet: booleanOption({ default: false }),
						output: stringOption({ alias: "o" }),
						retries: numberOption({ default: 3 }),
						files: arrayOption(),
						token: stringOption({
							hasSensitiveValue: true,
							description: "Auth token",
						}),
					},
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			assert.deepEqual(command.dashedOptions, {
				quiet: { type: "boolean", hasSensitiveValue: false, default: false },
				output: { type: "string", hasSensitiveValue: false, alias: "o" },
				retries: { type: "number", hasSensitiveValue: false, default: 3 },
				files: { type: "array", hasSensitiveValue: false },
				token: {
					type: "string",
					hasSensitiveValue: true,
					describe: "Auth token",
				},
			});
		});

		it("carries over what a redeclared CLI option leaves unspecified", () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestredeclare",
					options: {
						// Redeclared only to give this command its own default.
						output: stringOption({ default: "./here" }),
						watch: booleanOption({ default: false }),
					},
					run: (): void => undefined,
				}),
				createTestInjector({
					options: {
						output: { type: "string", alias: "o", hasSensitiveValue: true },
						watch: { type: "boolean", hasSensitiveValue: false },
					},
				}),
			);

			assert.deepEqual(command.dashedOptions, {
				output: {
					type: "string",
					hasSensitiveValue: true,
					default: "./here",
					alias: "o",
				},
				watch: { type: "boolean", hasSensitiveValue: false, default: false },
			});
		});

		it("lets a redeclaration override what it does specify", () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestoverride",
					options: {
						output: stringOption({ alias: "q", hasSensitiveValue: false }),
					},
					run: (): void => undefined,
				}),
				createTestInjector({
					options: {
						output: { type: "string", alias: "o", hasSensitiveValue: true },
					},
				}),
			);

			assert.deepEqual(command.dashedOptions, {
				output: { type: "string", hasSensitiveValue: false, alias: "q" },
			});
		});

		it("is empty when no options are declared", () => {
			const command = createCommandFromDefinition(
				defineCommand({ name: "dctestnoopts", run: (): void => undefined }),
				createTestInjector(),
			);

			assert.deepEqual(command.dashedOptions, {});
		});

		it("warns when a declared option or alias shadows a CLI-wide one", () => {
			const testInjector = createTestInjector({
				options: {
					quiet: { type: "boolean" },
					output: { type: "string", alias: "o" },
				},
			});

			createCommandFromDefinition(
				defineCommand({
					name: "dctestshadow",
					options: {
						quiet: stringOption(),
						target: stringOption({ alias: ["o", "t"] }),
						fresh: booleanOption({ alias: "f" }),
					},
					run: (): void => undefined,
				}),
				testInjector,
			);

			const logger: LoggerStub = testInjector.resolve("logger");
			assert.include(
				logger.warnOutput,
				"'--quiet' with the CLI option '--quiet'",
			);
			assert.include(
				logger.warnOutput,
				"alias '-o' of '--target' with the CLI option '--output'",
			);
			assert.notInclude(logger.warnOutput, "--fresh");
			assert.notInclude(logger.warnOutput, "'-t'");
		});

		it("stays quiet when a command only redefines a CLI-wide option's default", () => {
			const testInjector = createTestInjector({
				options: {
					watch: { type: "boolean" },
					output: { type: "string", alias: "o" },
				},
			});

			createCommandFromDefinition(
				defineCommand({
					name: "dctestredeclare",
					options: {
						watch: booleanOption({ default: true }),
						output: stringOption({ alias: "o" }),
					},
					run: (): void => undefined,
				}),
				testInjector,
			);

			assert.strictEqual(
				(<LoggerStub>testInjector.resolve("logger")).warnOutput,
				"",
			);
		});

		it("stays quiet when nothing collides", () => {
			const testInjector = createTestInjector({
				options: { path: { type: "string", alias: "p" } },
			});

			createCommandFromDefinition(
				defineCommand({
					name: "dctestnoshadow",
					options: { output: stringOption({ alias: ["o", "out"] }) },
					run: (): void => undefined,
				}),
				testInjector,
			);

			assert.strictEqual(
				(<LoggerStub>testInjector.resolve("logger")).warnOutput,
				"",
			);
		});
	});

	describe("canExecute", () => {
		it("rejects positional arguments before consulting the definition", async () => {
			let refined = false;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestnone",
					canExecute: () => {
						refined = true;
						return true;
					},
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			await assert.isRejected(
				command.canExecute(["stray"]),
				/doesn't accept parameters/,
			);
			assert.isFalse(refined);
			assert.isTrue(await command.canExecute([]));
			assert.isTrue(refined);
		});

		it("rejects positional arguments with no definition canExecute at all", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestnone2",
					params: "none",
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			await assert.isRejected(
				command.canExecute(["stray"]),
				/doesn't accept parameters/,
			);
			assert.isTrue(await command.canExecute([]));
		});

		it("accepts anything when arguments are 'any'", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestany",
					params: "any",
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			assert.isTrue(await command.canExecute(["whatever", "else"]));
		});

		it("hands the context to a definition canExecute and honours its verdict", async () => {
			const testInjector = createTestInjector({ force: true });
			let capturedContext: any;

			const build = (verdict: boolean) =>
				createCommandFromDefinition(
					defineCommand({
						name: "dctestverdict",
						params: "any",
						options: { force: booleanOption() },
						canExecute: (context) => {
							capturedContext = context;
							return verdict;
						},
						run: (): void => undefined,
					}),
					testInjector,
				);

			assert.isTrue(await build(true).canExecute(["android"]));
			assert.deepEqual(capturedContext.args, ["android"]);
			assert.deepEqual(capturedContext.options, { force: true });

			assert.isFalse(await build(false).canExecute(["android"]));
		});

		it("runs the definition canExecute inside an injection context", async () => {
			const testInjector = createTestInjector();
			testInjector.register("dcTestPolicy", { allowed: true });

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestcaninject",
					params: "any",
					canExecute: () => inject<any>("dcTestPolicy").allowed,
					run: (): void => undefined,
				}),
				testInjector,
			);

			assert.isTrue(await command.canExecute(["anything"]));
		});
	});

	describe("ctx.fail", () => {
		const createFailInjector = (): IInjector => {
			const testInjector = createTestInjector();
			testInjector.register("errors", {
				fail: (message: string) => {
					throw new Error(`without help: ${message}`);
				},
				failWithHelp: (message: string) => {
					throw new Error(`with help: ${message}`);
				},
			});
			return testInjector;
		};

		it("fails the command from run, through failWithHelp", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestfailrun",
					run: (ctx) => ctx.fail("no project found"),
				}),
				createFailInjector(),
			);

			await assert.isRejected(
				command.execute([]),
				/with help: no project found/,
			);
		});

		it("fails the command from canExecute, through failWithHelp", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestfailcan",
					params: "any",
					canExecute: (ctx) =>
						ctx.args.length === 1 || ctx.fail("expected one argument"),
					run: (): void => undefined,
				}),
				createFailInjector(),
			);

			assert.isTrue(await command.canExecute(["one"]));
			await assert.isRejected(
				command.canExecute([]),
				/with help: expected one argument/,
			);
		});

		it("fails the command from setup, through failWithHelp", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestfailsetup",
					setup: (ctx) => ctx.fail("no project found"),
					run: (): void => undefined,
				}),
				createFailInjector(),
			);

			await assert.isRejected(
				command.canExecute([]),
				/with help: no project found/,
			);
		});

		it("fails the command from run without help, through fail", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestfailrunplain",
					run: (ctx) => ctx.fail("no project found", { help: false }),
				}),
				createFailInjector(),
			);

			await assert.isRejected(
				command.execute([]),
				/without help: no project found/,
			);
		});

		it("fails the command from canExecute without help, through fail", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestfailcanplain",
					params: "any",
					canExecute: (ctx) =>
						ctx.args.length === 1 ||
						ctx.fail("expected one argument", { help: false }),
					run: (): void => undefined,
				}),
				createFailInjector(),
			);

			assert.isTrue(await command.canExecute(["one"]));
			await assert.isRejected(
				command.canExecute([]),
				/without help: expected one argument/,
			);
		});

		it("fails the command from setup without help, through fail", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestfailsetupplain",
					setup: (ctx) => ctx.fail("no project found", { help: false }),
					run: (): void => undefined,
				}),
				createFailInjector(),
			);

			await assert.isRejected(
				command.canExecute([]),
				/without help: no project found/,
			);
		});

		it("prints the help suggestion when the options leave help unset", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestfailhelpunset",
					run: (ctx) => ctx.fail("no project found", {}),
				}),
				createFailInjector(),
			);

			await assert.isRejected(
				command.execute([]),
				/with help: no project found/,
			);
		});

		it("rejects options that are not a plain object", async () => {
			for (const options of [null, "no help", ["help"], new Date()]) {
				const command = createCommandFromDefinition(
					defineCommand({
						name: "dctestfailbadoptions",
						run: (ctx) => ctx.fail("no project found", <any>options),
					}),
					createFailInjector(),
				);

				await assert.isRejected(
					command.execute([]),
					/ctx.fail\(\) for command 'dctestfailbadoptions' takes its options as a plain object/,
				);
			}
		});

		it("rejects an empty message when help is turned off", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestfailemptyplain",
					run: (ctx) => ctx.fail("", { help: false }),
				}),
				createFailInjector(),
			);

			await assert.isRejected(
				command.execute([]),
				/ctx.fail\(\) for command 'dctestfailemptyplain' requires a non-empty message/,
			);
		});

		it("rejects a message that carries nothing", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestfailempty",
					run: (ctx) => ctx.fail("  "),
				}),
				createFailInjector(),
			);

			await assert.isRejected(
				command.execute([]),
				/ctx.fail\(\) for command 'dctestfailempty' requires a non-empty message/,
			);
		});

		it("still lets a thrown error through unchanged", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestthrow",
					run: () => {
						throw new Error("raw failure");
					},
				}),
				createFailInjector(),
			);

			await assert.isRejected(command.execute([]), /^raw failure$/);
		});
	});

	describe("command flags", () => {
		it("passes disableAnalytics and enableHooks through", () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestflags",
					disableAnalytics: true,
					enableHooks: false,
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			assert.isTrue(command.disableAnalytics);
			assert.isFalse(command.enableHooks);
		});

		it("leaves both absent when the definition omits them", () => {
			const command = createCommandFromDefinition(
				defineCommand({ name: "dctestnoflags", run: (): void => undefined }),
				createTestInjector(),
			);

			assert.isFalse("disableAnalytics" in command);
			assert.isFalse("enableHooks" in command);
		});
	});

	describe("option validation with the real options service", () => {
		interface IValidationRun {
			failures: string[];
			options: any;
			injector: IInjector;
		}

		// The options service parses process.argv in its constructor, so each run
		// gets its own injector and its own instance.
		const validate = (definition: any, argv: string[]): IValidationRun => {
			const failures: string[] = [];
			const testInjector = new Yok();
			testInjector.register("staticConfig", { CLIENT_NAME: "" });
			testInjector.register("hostInfo", {});
			testInjector.register("settingsService", {
				setSettings: (): any => undefined,
				getProfileDir: () => "profileDir",
			});
			testInjector.register("logger", LoggerStub);

			const errors = new Errors(testInjector);
			errors.failWithHelp = <any>((message: string) => failures.push(message));
			errors.fail = <any>((message: string) => failures.push(message));
			testInjector.register("errors", errors);
			testInjector.register("options", Options);

			const originalArgv = process.argv;
			process.argv = [originalArgv[0], originalArgv[1], ...argv];
			try {
				const command = createCommandFromDefinition(definition, testInjector);
				const options: any = testInjector.resolve("options");
				options.validateOptions(command.dashedOptions);
				return { failures, options, injector: testInjector };
			} finally {
				process.argv = originalArgv;
			}
		};

		beforeEach(() => {
			process.env.NS_STRICT_OPTIONS = "error";
		});

		afterEach(() => {
			delete process.env.NS_STRICT_OPTIONS;
		});

		it("accepts an option declared with an array of aliases, under any spelling", () => {
			const definition = defineCommand({
				name: "dctest-alias",
				options: { outputDir: stringOption({ alias: ["o", "out"] }) },
				run: (): void => undefined,
			});

			for (const spelling of ["--output-dir", "--outputDir", "-o", "--out"]) {
				const run = validate(definition, [spelling, "dist"]);
				assert.deepEqual(run.failures, [], `rejected ${spelling}`);
				assert.strictEqual(run.options.outputDir, "dist");
			}
		});

		it("carries a declared option that is also CLI-wide onto ctx.options", async () => {
			const definition = defineCommand({
				name: "dctest-cliwide",
				options: {
					// --release is declared by the CLI itself; a command that reads it
					// declares it too, and the declaration only supplies the default.
					release: booleanOption({ default: false, alias: "r" }),
					outputDir: stringOption(),
				},
				run: (): void => undefined,
			});

			const run = validate(definition, ["--release", "--output-dir", "dist"]);
			assert.deepEqual(run.failures, []);

			let seen: any;
			const command = createCommandFromDefinition(
				{
					...definition,
					run: (ctx): void => {
						seen = ctx.options;
					},
				},
				run.injector,
			);
			await command.execute([]);

			assert.deepEqual(seen, { release: true, outputDir: "dist" });
			assert.strictEqual(
				(<LoggerStub>run.injector.resolve("logger")).warnOutput,
				"",
			);
		});

		it("still rejects an option the definition did not declare", () => {
			const definition = defineCommand({
				name: "dctest-alias2",
				options: { outputDir: stringOption({ alias: ["o", "out"] }) },
				run: (): void => undefined,
			});

			const run = validate(definition, ["--outputdirr", "dist"]);

			assert.lengthOf(run.failures, 1);
			assert.match(run.failures[0], /'outputdirr' is not supported/);
		});
	});

	describe("end to end through CommandsService", () => {
		let validatedOptions: any;

		const createCommandsServiceInjector = (options: any = {}): IInjector => {
			const testInjector = new Yok();
			testInjector.register("errors", {
				beginCommand: async (action: () => Promise<boolean>) => action(),
				failWithHelp: (message: string) => {
					throw new Error(message);
				},
				fail: (message: string) => {
					throw new Error(message);
				},
			});
			testInjector.register("hooksService", HooksServiceStub);
			testInjector.register("logger", LoggerStub);
			testInjector.register("staticConfig", {
				disableAnalytics: true,
				disableCommandHooks: true,
			});
			testInjector.register("extensibilityService", {});
			testInjector.register("optionsTracker", {});
			testInjector.register("options", {
				...options,
				validateOptions: (dashedOptions: any) => {
					validatedOptions = dashedOptions;
				},
			});
			testInjector.register("commandsService", CommandsService);
			return testInjector;
		};

		beforeEach(() => {
			validatedOptions = undefined;
		});

		it("validates the declared options and runs the command", async () => {
			const testInjector = createCommandsServiceInjector({ quiet: true });
			let ran: any;

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-e2e",
						options: { quiet: booleanOption({ default: false }) },
						params: "any",
						run: (context) => {
							ran = context;
						},
					}),
				),
			);

			const commandsService: ICommandsService =
				testInjector.resolve("commandsService");
			await commandsService.tryExecuteCommand("dctest-e2e", ["alpha"]);

			assert.deepEqual(validatedOptions, {
				quiet: { type: "boolean", hasSensitiveValue: false, default: false },
			});
			assert.deepEqual(ran.args, ["alpha"]);
			assert.deepEqual(ran.options, { quiet: true });
		});

		it("rejects parameters when arguments are 'none'", async () => {
			const testInjector = createCommandsServiceInjector();
			let ran = false;

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-e2e-none",
						run: () => {
							ran = true;
						},
					}),
				),
			);

			const commandsService: ICommandsService =
				testInjector.resolve("commandsService");
			await assert.isRejected(
				commandsService.tryExecuteCommand("dctest-e2e-none", ["stray"]),
				/doesn't accept parameters/,
			);
			assert.isFalse(ran);
		});

		it("rejects parameters even when the definition supplies a canExecute", async () => {
			const testInjector = createCommandsServiceInjector();
			let ran = false;

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-e2e-refine",
						canExecute: () => true,
						run: () => {
							ran = true;
						},
					}),
				),
			);

			const commandsService: ICommandsService =
				testInjector.resolve("commandsService");
			await assert.isRejected(
				commandsService.tryExecuteCommand("dctest-e2e-refine", ["stray"]),
				/doesn't accept parameters/,
			);
			assert.isFalse(ran);
		});

		it("dispatches a subcommand through the parent name", async () => {
			const testInjector = createCommandsServiceInjector();
			let ran: any;

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-widget|add",
						params: "any",
						run: (context) => {
							ran = context;
						},
					}),
				),
			);

			const commandsService: ICommandsService =
				testInjector.resolve("commandsService");
			await commandsService.tryExecuteCommand("dctest-widget", [
				"add",
				"alpha",
			]);

			assert.deepEqual(ran.args, ["alpha"]);
		});

		it("dispatches the default subcommand, named or bare", async () => {
			const testInjector = createCommandsServiceInjector();
			const runs: string[][] = [];

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-gadget|*all",
						params: "any",
						run: (context) => {
							runs.push(context.args);
						},
					}),
				),
			);

			const commandsService: ICommandsService =
				testInjector.resolve("commandsService");
			await commandsService.tryExecuteCommand("dctest-gadget", ["all", "beta"]);
			await commandsService.tryExecuteCommand("dctest-gadget", []);

			assert.deepEqual(runs, [["beta"], []]);
		});
	});

	describe("canExecuteCommand", () => {
		const createInProcessInjector = (): IInjector => {
			const testInjector = new Yok();
			testInjector.register("errors", {
				beginCommand: async (action: () => Promise<boolean>) => action(),
				failWithHelp: (message: string) => {
					throw new Error(message);
				},
				fail: (message: string) => {
					throw new Error(message);
				},
				reportCommandError: async (ex: Error) => {
					throw ex;
				},
			});
			testInjector.register("hooksService", HooksServiceStub);
			testInjector.register("logger", LoggerStub);
			testInjector.register("staticConfig", {
				disableAnalytics: true,
				disableCommandHooks: true,
			});
			testInjector.register("extensibilityService", {});
			testInjector.register("optionsTracker", {});
			testInjector.register("options", {
				validateOptions: (): void => undefined,
			});
			testInjector.register("commandsService", CommandsService);
			return testInjector;
		};

		it("returns the named command's own verdict without running it", async () => {
			const testInjector = createInProcessInjector();
			let ran = false;

			runInInjectionContext(testInjector, () => {
				registerCommand(
					defineCommand({
						name: "dctest-can-yes",
						params: "any",
						canExecute: (context) => context.args[0] === "ok",
						run: () => {
							ran = true;
						},
					}),
				);
			});

			const verdicts = [
				await testInjector
					.resolve("commandsService")
					.canExecuteCommand("dctest-can-yes", ["ok"]),
				await testInjector
					.resolve("commandsService")
					.canExecuteCommand("dctest-can-yes", ["nope"]),
			];

			assert.deepEqual(verdicts, [true, false]);
			assert.isFalse(ran);
		});

		it("is the CommandsService contract's method, resolved by the registered name", async () => {
			const testInjector = createInProcessInjector();
			let ran = false;

			runInInjectionContext(testInjector, () => {
				registerCommand(
					defineCommand({
						name: "dctest-can-contract",
						params: "any",
						canExecute: (context) => context.args[0] === "ok",
						run: () => {
							ran = true;
						},
					}),
				);
			});

			const service = testInjector.get(CommandsServiceContract);
			assert.instanceOf(service, <any>CommandsServiceContract);
			assert.isTrue(
				await service.canExecuteCommand("dctest-can-contract", ["ok"]),
			);
			assert.isFalse(ran);

			await service.runCommand("dctest-can-contract", ["ok"]);
			assert.isTrue(ran);
		});

		it("runs a definition or class as given, registered or not", async () => {
			const testInjector = createInProcessInjector();
			const runs: string[] = [];
			const definition = defineCommand({
				name: ["dctest-ref-primary", "dctest-ref-alias"],
				params: "any",
				canExecute: (context) => context.args[0] === "ok",
				run: () => {
					runs.push("definition");
				},
			});
			class RefCommand extends Command({
				name: "dctest-ref-class",
				params: "any",
			}) {
				run(): void {
					runs.push("class");
				}
			}
			// Registered under the same name as the definition, to show the
			// definition wins over the lookup.
			runInInjectionContext(testInjector, () => {
				registerCommand(
					defineCommand({
						name: "dctest-ref-primary",
						params: "any",
						run: () => {
							runs.push("registered");
						},
					}),
				);
			});
			const service = testInjector.get(CommandsServiceContract);

			assert.isTrue(await service.canExecuteCommand(definition, ["ok"]));
			assert.isFalse(await service.canExecuteCommand(definition, ["no"]));
			await service.runCommand(definition, ["ok"]);
			await service.runCommand(RefCommand);
			await service.runCommand("dctest-ref-primary");
			assert.deepEqual(runs, ["definition", "class", "registered"]);

			await assert.isRejected(
				service.runCommand(<any>{ name: "not-a-definition" }),
				/Expected a command name/,
			);
		});

		it("enforces the child's arguments policy before its canExecute", async () => {
			const testInjector = createInProcessInjector();
			let consulted = false;

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-can-none",
						canExecute: () => {
							consulted = true;
							return true;
						},
						run: (): void => undefined,
					}),
				),
			);

			await assert.isRejected(
				testInjector
					.resolve("commandsService")
					.canExecuteCommand("dctest-can-none", ["stray"]),
				/doesn't accept parameters/,
			);
			assert.isFalse(consulted);
		});

		it("builds the child's setup from the child's own services", async () => {
			const testInjector = createInProcessInjector();
			testInjector.register("gadgetService", { ready: true });

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-can-setup",
						setup: () => ({
							$gadgetService: inject<any>("gadgetService"),
						}),
						canExecute: (context, services) => services.$gadgetService.ready,
						run: (): void => undefined,
					}),
				),
			);

			assert.isTrue(
				await testInjector
					.resolve("commandsService")
					.canExecuteCommand("dctest-can-setup"),
			);
		});

		it("fails by name for a command that is not registered", async () => {
			const testInjector = createInProcessInjector();

			await assert.isRejected(
				testInjector
					.resolve("commandsService")
					.canExecuteCommand("dctest-can-missing"),
				/Unknown command 'dctest-can-missing'/,
			);
		});
	});

	describe("positional argument specs", () => {
		const platformCommand = (extra: any = {}) =>
			createCommandFromDefinition(
				defineCommand({
					name: "dctest-positional",
					params: [
						{ name: "platform", required: true },
						{ name: "target" },
						...(extra.variadic ? [{ name: "rest", variadic: true }] : []),
					],
					run: (ctx) => {
						extra.seen = ctx.params;
					},
				}),
				createTestInjector(),
			);

		it("maps arguments onto ctx.params strictly by position", async () => {
			const extra: any = {};
			const command = platformCommand(extra);

			assert.isTrue(await command.canExecute(["android", "device"]));
			await command.execute(["android", "device"]);

			assert.deepEqual(extra.seen, { platform: "android", target: "device" });
		});

		it("leaves an unfilled optional argument off ctx.params", async () => {
			const extra: any = {};
			const command = platformCommand(extra);

			await command.execute(["android"]);

			assert.deepEqual(extra.seen, { platform: "android" });
		});

		it("collects the rest into a variadic argument, empty array included", async () => {
			const extra: any = { variadic: true };
			const command = platformCommand(extra);

			await command.execute(["android", "device", "a", "b"]);
			assert.deepEqual(extra.seen, {
				platform: "android",
				target: "device",
				rest: ["a", "b"],
			});

			await command.execute(["android", "device"]);
			assert.deepEqual(extra.seen, {
				platform: "android",
				target: "device",
				rest: [],
			});
		});

		it("exposes an empty ctx.params when no specs are declared", async () => {
			let seen: any;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-noargspecs",
					params: "any",
					run: (ctx) => {
						seen = ctx.params;
					},
				}),
				createTestInjector(),
			);

			await command.execute(["one"]);

			assert.deepEqual(seen, {});
		});

		it("fails naming every missing required argument", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-missing",
					params: [
						{ name: "platform", required: true },
						{
							name: "device",
							required: true,
							errorMessage: "Provide a device identifier.",
						},
					],
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			await assert.isRejected(
				command.canExecute([]),
				/Missing required argument 'platform'[\s\S]*Provide a device identifier\./,
			);
			// The generic preamble precedes the specific messages, as the
			// parameter machinery printed it.
			await assert.isRejected(
				command.canExecute(["android"]),
				/^You need to provide all the required parameters\.\s+Provide a device identifier\.$/,
			);
			assert.isTrue(await command.canExecute(["android", "emulator-1"]));
		});

		it("treats a required variadic argument as needing at least one value", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-reqvariadic",
					params: [{ name: "files", required: true, variadic: true }],
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			await assert.isRejected(
				command.canExecute([]),
				/Missing required argument 'files'/,
			);
			assert.isTrue(await command.canExecute(["a.ts", "b.ts"]));
		});

		it("rejects more arguments than the specs declare", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-toomany",
					params: [{ name: "platform" }],
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			await assert.isRejected(
				command.canExecute(["android", "extra"]),
				/accepts at most 1 parameter\(s\), but 2 were provided/,
			);
			assert.isTrue(await command.canExecute(["android"]));
		});

		it("rejects any argument when the spec array is empty", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-emptyspecs",
					params: [],
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			await assert.isRejected(
				command.canExecute(["stray"]),
				/doesn't accept parameters/,
			);
		});

		it("runs validate per value and uses a returned string as the message", async () => {
			const seen: string[] = [];
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-validate",
					params: [
						{
							name: "platforms",
							variadic: true,
							validate: async (value) => {
								seen.push(value);
								await Promise.resolve();
								return (
									value === "android" || `'${value}' is not a known platform.`
								);
							},
						},
					],
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			assert.isTrue(await command.canExecute(["android", "android"]));
			assert.deepEqual(seen, ["android", "android"]);

			await assert.isRejected(
				command.canExecute(["android", "blackberry"]),
				/'blackberry' is not a known platform\./,
			);
		});

		it("falls back to a default message when validate just returns false", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-validate-false",
					params: [{ name: "platform", validate: () => false }],
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			await assert.isRejected(
				command.canExecute(["ios"]),
				/The parameter 'ios' is not valid for 'platform'\./,
			);
		});

		it("runs validate in the invocation's injection context", async () => {
			const testInjector = createTestInjector();
			let seen: unknown;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-validate-inject",
					params: [
						{
							name: "platform",
							validate: (value, ctx) => {
								seen = inject(COMMAND_CONTEXT) === ctx;
								return true;
							},
						},
					],
					run: (): void => undefined,
				}),
				testInjector,
			);

			await command.canExecute(["ios"]);

			assert.strictEqual(seen, true);
		});

		it("hands validate the command context", async () => {
			const testInjector = createTestInjector({ force: true });
			let capturedContext: any;

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-validate-ctx",
					options: { force: booleanOption() },
					params: [
						{
							name: "platform",
							validate: (value, ctx) => {
								capturedContext = ctx;
								return true;
							},
						},
					],
					run: (): void => undefined,
				}),
				testInjector,
			);

			await command.canExecute(["android"]);

			assert.deepEqual(capturedContext.options, { force: true });
			assert.deepEqual(capturedContext.params, { platform: "android" });
		});

		it("enforces the specs before consulting the definition canExecute", async () => {
			let refined = false;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-specs-first",
					params: [{ name: "platform", required: true }],
					canExecute: () => {
						refined = true;
						return true;
					},
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			await assert.isRejected(command.canExecute([]), /Missing required/);
			assert.isFalse(refined);
		});
	});

	describe("argument-spec validation", () => {
		const rejects = (specs: any, expected: RegExp) =>
			assert.throws(
				() =>
					defineCommand(<any>{
						name: "dctest-spec",
						params: specs,
						run: (): void => undefined,
					}),
				expected,
			);

		it("rejects a spec that is not an object, or has no name", () => {
			rejects(["platform"], /argument #1 of 'params' must be an object/);
			rejects(
				[{ required: true }],
				/argument #1 of 'params' has no usable 'name'/,
			);
			rejects([{ name: "  " }], /argument #1 of 'params' has no usable 'name'/);
		});

		it("rejects a typo'd spec field", () => {
			rejects(
				[{ name: "platform", requried: true }],
				/argument 'platform' has unknown field\(s\) 'requried'/,
			);
		});

		it("rejects a duplicate argument name", () => {
			rejects(
				[{ name: "platform" }, { name: "platform" }],
				/'params' declares 'platform' twice/,
			);
		});

		it("rejects unusable required, variadic, description, errorMessage and validate", () => {
			rejects(
				[{ name: "platform", required: "yes" }],
				/argument 'platform' declares a non-boolean 'required'/,
			);
			rejects(
				[{ name: "platform", variadic: 1 }],
				/argument 'platform' declares a non-boolean 'variadic'/,
			);
			rejects(
				[{ name: "platform", description: 5 }],
				/argument 'platform' declares a non-string 'description'/,
			);
			rejects(
				[{ name: "platform", errorMessage: 5 }],
				/argument 'platform' declares a non-string 'errorMessage'/,
			);
			rejects(
				[{ name: "platform", validate: "nope" }],
				/argument 'platform' has a non-function 'validate'/,
			);
		});

		it("rejects a variadic argument that is not the last one", () => {
			rejects(
				[{ name: "rest", variadic: true }, { name: "platform" }],
				/argument 'rest' is variadic but is not the last one/,
			);
		});

		it("rejects a required argument that follows an optional one", () => {
			rejects(
				[{ name: "platform" }, { name: "device", required: true }],
				/param 'device' is required but follows the optional 'platform'/,
			);
		});

		it("accepts a well-formed spec array", () => {
			assert.doesNotThrow(() =>
				defineCommand({
					name: "dctest-spec-ok",
					params: [
						{
							name: "platform",
							required: true,
							description: "The platform",
							errorMessage: "Provide a platform.",
							validate: () => true,
						},
						{ name: "rest", variadic: true },
					],
					run: (): void => undefined,
				}),
			);
		});
	});

	describe("setup", () => {
		it("runs before canExecute and hands its result to every stage", async () => {
			const order: string[] = [];
			const testInjector = createTestInjector();
			testInjector.register("dcTestProject", { dir: "/app" });

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-setup",
					setup: () => {
						order.push("setup");
						return inject<any>("dcTestProject").dir;
					},
					canExecute: (ctx, projectDir) => {
						order.push(`canExecute:${projectDir}`);
						return true;
					},
					run: (ctx, projectDir) => {
						order.push(`run:${projectDir}`);
						return projectDir.length;
					},
					postRun: (ctx, result, projectDir) => {
						order.push(`postRun:${result}:${projectDir}`);
					},
				}),
				testInjector,
			);

			await command.canExecute([]);
			await command.execute([]);
			await command.postCommandAction([]);

			assert.deepEqual(order, [
				"setup",
				"canExecute:/app",
				"run:/app",
				"postRun:4:/app",
			]);
		});

		it("runs once per invocation, whichever stage comes first", async () => {
			let runs = 0;
			const build = () =>
				createCommandFromDefinition(
					defineCommand({
						name: "dctest-setup-once",
						setup: async () => {
							runs++;
							return runs;
						},
						run: (): void => undefined,
					}),
					createTestInjector(),
				);

			const viaCanExecute = build();
			await viaCanExecute.canExecute([]);
			await viaCanExecute.execute([]);
			assert.strictEqual(runs, 1);

			runs = 0;
			const viaExecute = build();
			await viaExecute.execute([]);
			assert.strictEqual(runs, 1);
		});

		it("runs again for the next invocation of the same command object", async () => {
			let runs = 0;
			const seen: number[] = [];
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-setup-per-invocation",
					setup: async () => ++runs,
					run: (ctx, attempt: number) => {
						seen.push(attempt);
					},
				}),
				createTestInjector(),
			);

			await command.canExecute([]);
			await command.execute([]);
			await command.canExecute([]);
			await command.execute([]);

			assert.strictEqual(runs, 2);
			assert.deepEqual(seen, [1, 2]);
		});

		it("starts a new invocation for an execute with no canExecute of its own", async () => {
			let runs = 0;
			const seen: number[] = [];
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-setup-repeat-execute",
					setup: async () => ++runs,
					run: (ctx, attempt: number) => {
						seen.push(attempt);
					},
				}),
				createTestInjector(),
			);

			await command.execute([]);
			await command.execute([]);

			assert.strictEqual(runs, 2);
			assert.deepEqual(seen, [1, 2]);
		});

		it("hands undefined through when no setup is declared", async () => {
			let seen: any = "untouched";
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-nosetup",
					run: (ctx, setupResult) => {
						seen = setupResult;
					},
				}),
				createTestInjector(),
			);

			await command.execute([]);

			assert.isUndefined(seen);
		});

		it("can fail the command from setup", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-setup-fail",
					setup: (ctx) => ctx.fail("no project found"),
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			await assert.isRejected(command.canExecute([]), /no project found/);
		});
	});

	describe("postRun", () => {
		it("is exposed as postCommandAction only when declared", () => {
			const withPostRun = createCommandFromDefinition(
				defineCommand({
					name: "dctest-postrun",
					run: (): void => undefined,
					postRun: (): void => undefined,
				}),
				createTestInjector(),
			);
			const withoutPostRun = createCommandFromDefinition(
				defineCommand({
					name: "dctest-nopostrun",
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			assert.isFunction(withPostRun.postCommandAction);
			assert.isFalse("postCommandAction" in withoutPostRun);
		});

		it("receives what run returned, inside an injection context", async () => {
			const testInjector = createTestInjector();
			testInjector.register("dcTestReporter", { name: "reporter" });
			let seen: any;
			let injected: string;

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-postrun-result",
					params: "any",
					run: async () => {
						await Promise.resolve();
						return { created: "my-app" };
					},
					postRun: (ctx, result) => {
						injected = inject<any>("dcTestReporter").name;
						seen = { args: ctx.args, result };
					},
				}),
				testInjector,
			);

			await command.execute(["my-app"]);
			await command.postCommandAction(["my-app"]);

			assert.deepEqual(seen, {
				args: ["my-app"],
				result: { created: "my-app" },
			});
			assert.strictEqual(injected, "reporter");
		});
	});

	describe("allowUnknownOptions", () => {
		it("sets allowUnknownOptions on the compiled command", () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-unknown",
					allowUnknownOptions: true,
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			assert.isTrue(command.allowUnknownOptions);
		});

		it("leaves it absent when the definition omits it", () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-unknown-off",
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			assert.isFalse("allowUnknownOptions" in command);
		});

		it("keeps the command's own options working alongside unknown ones", () => {
			const testInjector = new Yok();
			testInjector.register("staticConfig", { CLIENT_NAME: "" });
			testInjector.register("hostInfo", {});
			testInjector.register("settingsService", {
				setSettings: (): any => undefined,
				getProfileDir: () => "profileDir",
			});
			testInjector.register("logger", LoggerStub);
			const failures: string[] = [];
			const errors = new Errors(testInjector);
			errors.failWithHelp = <any>((message: string) => failures.push(message));
			errors.fail = <any>((message: string) => failures.push(message));
			testInjector.register("errors", errors);
			testInjector.register("options", Options);

			const definition = defineCommand({
				name: "dctest-passthrough",
				allowUnknownOptions: true,
				options: { tag: stringOption() },
				run: (): void => undefined,
			});

			const originalArgv = process.argv;
			process.argv = [
				originalArgv[0],
				originalArgv[1],
				"--tag",
				"beta",
				"--flag-of-another-cli",
			];
			process.env.NS_STRICT_OPTIONS = "error";
			try {
				const command = createCommandFromDefinition(definition, testInjector);
				const options: any = testInjector.resolve("options");
				options.validateOptions(
					command.dashedOptions,
					command.allowUnknownOptions,
				);

				// The foreign flag is tolerated...
				assert.deepEqual(failures, []);
				// ...and the command's own option is still parsed.
				assert.equal(options.tag, "beta");
			} finally {
				process.argv = originalArgv;
				delete process.env.NS_STRICT_OPTIONS;
			}
		});

		it("rejects a non-boolean allowUnknownOptions", () => {
			assert.throws(
				() =>
					defineCommand(<any>{
						name: "dctest-unknown-bad",
						allowUnknownOptions: "yes",
						run: (): void => undefined,
					}),
				/'allowUnknownOptions' must be a boolean/,
			);
		});

		it("tells CommandsService to tolerate unknown options", async () => {
			let validatedWith: any;
			const testInjector = new Yok();
			testInjector.register("errors", {
				beginCommand: async (action: () => Promise<boolean>) => action(),
				failWithHelp: (message: string) => {
					throw new Error(message);
				},
			});
			testInjector.register("hooksService", HooksServiceStub);
			testInjector.register("logger", LoggerStub);
			testInjector.register("staticConfig", {
				disableAnalytics: true,
				disableCommandHooks: true,
			});
			testInjector.register("extensibilityService", {});
			testInjector.register("optionsTracker", {});
			testInjector.register("options", {
				validateOptions: (dashedOptions: any, allowUnknown: boolean) => {
					validatedWith = { dashedOptions, allowUnknown };
				},
			});
			testInjector.register("commandsService", CommandsService);

			let ran = false;
			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-unknown-e2e",
						allowUnknownOptions: true,
						params: "any",
						run: () => {
							ran = true;
						},
					}),
				),
			);

			const commandsService: ICommandsService =
				testInjector.resolve("commandsService");
			await commandsService.tryExecuteCommand("dctest-unknown-e2e", ["stray"]);

			assert.isTrue(ran);
			// Validation still runs - it is the rejection of unknown flags that
			// is suppressed, so a passthrough command keeps its own options.
			assert.isTrue(validatedWith.allowUnknown);
		});
	});

	describe("lazy registration", () => {
		it("claims the name and routes without loading the definition", () => {
			const testInjector = createTestInjector();
			let loads = 0;
			const definition = defineCommand({
				name: "dctestlazy|sub",
				run: (): void => undefined,
			});

			runInInjectionContext(testInjector, () =>
				registerLazyCommand<typeof definition>("dctestlazy|sub", () => {
					loads++;
					return definition;
				}),
			);

			assert.strictEqual(loads, 0);
			assert.deepStrictEqual(
				testInjector.getChildrenCommandsNames("dctestlazy"),
				["sub"],
			);
			assert.deepStrictEqual(
				testInjector.buildHierarchicalCommand("dctestlazy", ["sub", "extra"]),
				{ commandName: "dctestlazy|sub", remainingArguments: ["extra"] },
			);
			assert.strictEqual(loads, 0);

			assert.isFunction(testInjector.resolveCommand("dctestlazy|sub").execute);
			assert.strictEqual(loads, 1);
		});

		it("rejects a definition that declares another name", () => {
			const testInjector = createTestInjector();
			const definition = defineCommand({
				name: "dctestlazyother",
				run: (): void => undefined,
			});

			runInInjectionContext(testInjector, () =>
				registerLazyCommand<any>("dctestlazymismatch", () => definition),
			);

			assert.throws(
				() => testInjector.resolveCommand("dctestlazymismatch"),
				/declares itself as 'dctestlazyother'/,
			);
		});

		it("rejects a loader that does not return a definition", () => {
			const testInjector = createTestInjector();

			runInInjectionContext(testInjector, () =>
				registerLazyCommand<any>(
					"dctestlazyraw",
					() => <any>{ name: "dctestlazyraw", run: (): void => undefined },
				),
			);

			assert.throws(
				() => testInjector.resolveCommand("dctestlazyraw"),
				/defineCommand\(\) definition/,
			);
		});

		it("adds the providers to each invocation's injector, not at resolution", async () => {
			const testInjector = createTestInjector();
			const GREETING = new InjectionToken<string>("dctestLazyGreeting");
			let seen: string;
			const definition = defineCommand({
				name: "dctestlazyscoped",
				setup: () => inject(GREETING),
				run: (context, greeting: string): void => {
					seen = greeting;
				},
			});

			let children = 0;
			const createChild = (<any>testInjector).createChild.bind(testInjector);
			(<any>testInjector).createChild = (providers: any) => {
				children++;
				return createChild(providers);
			};

			runInInjectionContext(testInjector, () =>
				registerLazyCommand<typeof definition>(
					"dctestlazyscoped",
					() => definition,
					[{ provide: GREETING, useValue: "hello" }],
				),
			);

			assert.strictEqual(children, 0);

			const command = testInjector.resolveCommand("dctestlazyscoped");
			assert.strictEqual(children, 0);

			await command.execute([]);
			assert.strictEqual(children, 1);
			assert.strictEqual(seen, "hello");
			// The provider lives in the invocation's own injector, not the one the
			// registration was made against.
			assert.isNotOk((<any>testInjector).get(GREETING, { optional: true }));
		});

		it("reports a name the CLI already provides", () => {
			const testInjector = createTestInjector();
			testInjector.registerCommand("dctestlazytaken", () => ({
				allowedParameters: <any[]>[],
				execute: async (): Promise<void> => undefined,
			}));

			const result = runInInjectionContext(testInjector, () =>
				registerLazyCommand<any>("dctestlazytaken", () => <any>null),
			);

			assert.deepStrictEqual(result, {
				registered: false,
				rejection: { reason: "built-in" },
			});
		});

		it("registers against the injection context and takes its owner", async () => {
			const testInjector = createTestInjector();
			const scope = testInjector.createChild([
				{ provide: COMMAND_OWNER, useValue: "dctest-extension" },
			]);
			let seenInjector: any;
			const definition = defineCommand({
				name: "dctestlazyambient",
				run: (ctx): void => {
					seenInjector = ctx.injector;
				},
			});

			const result = runInInjectionContext(scope, () =>
				registerLazyCommand<typeof definition>(
					"dctestlazyambient",
					() => definition,
				),
			);
			assert.deepStrictEqual(result, { registered: true });

			await testInjector.resolveCommand("dctestlazyambient").execute([]);
			assert.strictEqual(seenInjector.parent, scope);

			assert.deepStrictEqual(
				runInInjectionContext(testInjector, () =>
					registerLazyCommand<typeof definition>(
						"dctestlazyambient",
						() => definition,
					),
				),
				{
					registered: false,
					rejection: { reason: "claimed", owner: "dctest-extension" },
				},
			);
		});

		it("belongs to the CLI outside an injection context", () => {
			const testInjector = createTestInjector();
			const definition = defineCommand({
				name: "dctestlazyunowned",
				run: (): void => undefined,
			});

			const register = () =>
				runInInjectionContext(testInjector, () =>
					registerLazyCommand<typeof definition>(
						"dctestlazyunowned",
						() => definition,
					),
				);

			assert.deepStrictEqual(register(), { registered: true });
			// Same owner: re-registering the CLI's own name is a no-op, not a
			// conflict.
			assert.deepStrictEqual(register(), { registered: true });

			const rootDefinition = defineCommand({
				name: "dctestlazyroot|sub",
				run: (): void => undefined,
			});
			registerLazyCommand<typeof rootDefinition>(
				"dctestlazyroot|sub",
				() => rootDefinition,
			);
			assert.deepStrictEqual(
				getRootInjector().getChildrenCommandsNames("dctestlazyroot"),
				["sub"],
			);

			const scope = testInjector.createChild([
				{ provide: COMMAND_OWNER, useValue: "dctest-extension" },
			]);
			assert.deepStrictEqual(
				runInInjectionContext(scope, () =>
					registerLazyCommand<typeof definition>(
						"dctestlazyunowned",
						() => definition,
					),
				),
				{
					registered: false,
					rejection: { reason: "claimed", owner: "the NativeScript CLI" },
				},
			);
		});
	});

	describe("ctx.injector", () => {
		it("is the invocation's injector, a child of the registration injector", async () => {
			const testInjector = createTestInjector();
			testInjector.register("dcTestRegistered", { value: "parent" });
			let seen: any;
			let seenContext: any;
			let injectedContext: any;

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-injector",
					run: (ctx) => {
						injectedContext = inject(COMMAND_CONTEXT);
						seen = ctx.injector;
						seenContext = ctx.injector.get(COMMAND_CONTEXT);
					},
				}),
				testInjector,
			);

			await command.execute([]);

			assert.notStrictEqual(seen, testInjector);
			assert.strictEqual(seenContext, injectedContext);
			assert.strictEqual(seen.get("dcTestRegistered").value, "parent");
		});

		it("is a different injector for each invocation", async () => {
			const testInjector = createTestInjector();
			const seen: any[] = [];

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-injector-per-invocation",
					run: (ctx) => {
						seen.push(ctx.injector);
					},
				}),
				testInjector,
			);

			await command.execute([]);
			await command.execute([]);

			assert.notStrictEqual(seen[0], seen[1]);
		});

		it("resolves after the first await, where inject() no longer can", async () => {
			const testInjector = createTestInjector();
			testInjector.register("dcTestLate", { value: 42 });
			let late: any;
			let injectFailed = false;

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-injector-late",
					run: async (ctx) => {
						await Promise.resolve();
						try {
							inject<any>("dcTestLate");
						} catch (err) {
							injectFailed = true;
						}
						late = ctx.injector.get("dcTestLate").value;
					},
				}),
				testInjector,
			);

			await command.execute([]);

			assert.isTrue(injectFailed);
			assert.strictEqual(late, 42);
		});
	});

	describe("class form", () => {
		it("runs with the declared options and arguments", async () => {
			const testInjector = createTestInjector({ release: true });
			const seen: any[] = [];

			class Widget extends Command({
				name: "dctest-class",
				options: { release: booleanOption({ default: false }) },
				params: "any",
			}) {
				public run(): void {
					seen.push([this.options.release, this.args, this.context.params]);
				}
			}

			assert.isTrue(isCommandClass(Widget));
			assert.isTrue(isCommandDefinition(Widget.definition));

			const command = createCommandFromDefinition(
				Widget.definition,
				testInjector,
			);
			await command.execute(["android"]);

			assert.deepEqual(seen, [[true, ["android"], {}]]);
		});

		it("derives one definition per class, not per access", () => {
			class Widget extends Command({ name: "dctest-class-cached" }) {
				public run(): void {
					/* intentionally left blank */
				}
			}

			assert.strictEqual(Widget.definition, Widget.definition);
			assert.equal(Widget.definition.name, "dctest-class-cached");
		});

		it("builds one instance per invocation, with inject() fields resolved", async () => {
			const testInjector = createTestInjector();
			testInjector.register("dcTestGreeter", { greet: () => "hello" });
			const instances: any[] = [];

			class Widget extends Command({ name: "dctest-class-instances" }) {
				private $greeter = inject<any>("dcTestGreeter");

				public run(): void {
					instances.push(this);
					assert.equal(this.$greeter.greet(), "hello");
				}
			}

			const command = createCommandFromDefinition(
				Widget.definition,
				testInjector,
			);
			await command.execute([]);
			await command.execute([]);

			assert.lengthOf(instances, 2);
			assert.notStrictEqual(instances[0], instances[1]);
			assert.instanceOf(instances[0], Widget);
		});

		it("honours an optional canExecute and leaves it out when undeclared", async () => {
			const testInjector = createTestInjector();

			class Refusing extends Command({
				name: "dctest-class-refuses",
				params: "any",
			}) {
				public canExecute(): boolean {
					return this.args[0] === "yes";
				}

				public run(): void {
					/* intentionally left blank */
				}
			}

			class Plain extends Command({ name: "dctest-class-plain" }) {
				public run(): void {
					/* intentionally left blank */
				}
			}

			assert.isUndefined(Plain.definition.canExecute);

			const refusing = createCommandFromDefinition(
				Refusing.definition,
				testInjector,
			);
			assert.isFalse(await refusing.canExecute(["no"]));
			assert.isTrue(await refusing.canExecute(["yes"]));

			const plain = createCommandFromDefinition(Plain.definition, testInjector);
			assert.isTrue(await plain.canExecute([]));
		});

		it("wires postRun to the result run returned", async () => {
			const testInjector = createTestInjector();
			const order: string[] = [];

			class Widget extends Command({
				name: "dctest-class-postrun",
			}) {
				public run(): number {
					order.push("run");
					return 7;
				}

				public postRun(result: number): void {
					order.push(`postRun:${result}`);
				}
			}

			const command = createCommandFromDefinition(
				Widget.definition,
				testInjector,
			);
			await command.execute([]);
			await command.postCommandAction([]);

			assert.deepEqual(order, ["run", "postRun:7"]);
		});

		it("wires shortcuts, and declares none when the class has no method", async () => {
			const savedSetting = process.env.NS_COMMAND_SHORTCUTS;
			process.env.NS_COMMAND_SHORTCUTS = "true";

			try {
				const testInjector = createTestInjector();
				const attached: string[][] = [];
				testInjector.register("keyShortcutService", {
					attach(options: { shortcuts: KeyShortcut[] }): boolean {
						attached.push(options.shortcuts.map((shortcut) => shortcut.key));
						return true;
					},
					printHint: (): void => undefined,
				});

				class Widget extends Command({ name: "dctest-class-shortcuts" }) {
					public run(): void {
						/* intentionally left blank */
					}

					public shortcuts(): KeyShortcut[] {
						return [
							{
								key: "r",
								description: `Restart ${this.args[0]}`,
								action: (): void => undefined,
							},
						];
					}
				}

				class Plain extends Command({ name: "dctest-class-no-shortcuts" }) {
					public run(): void {
						/* intentionally left blank */
					}
				}

				assert.isUndefined(Plain.definition.shortcuts);

				const command = createCommandFromDefinition(
					Widget.definition,
					testInjector,
				);
				await command.execute(["ios"]);

				assert.deepEqual(attached, [["r"]]);
			} finally {
				if (savedSetting === undefined) {
					delete process.env.NS_COMMAND_SHORTCUTS;
				} else {
					process.env.NS_COMMAND_SHORTCUTS = savedSetting;
				}
			}
		});

		it("registers through registerCommand and registerBuiltInCommand", async () => {
			const testInjector = createTestInjector();
			const ran: string[] = [];

			class Direct extends Command({ name: "dctest-class-direct" }) {
				public run(): void {
					ran.push("direct");
				}
			}

			class Lazy extends Command({ name: "dctest-class-lazy" }) {
				public run(): void {
					ran.push("lazy");
				}
			}

			runInInjectionContext(testInjector, () => registerCommand(Direct));
			runInInjectionContext(testInjector, () =>
				registerBuiltInCommand<typeof Lazy>(
					"dctest-class-lazy",
					() => <any>Lazy,
				),
			);

			await testInjector.resolveCommand("dctest-class-direct").execute([]);
			await testInjector.resolveCommand("dctest-class-lazy").execute([]);

			assert.deepEqual(ran, ["direct", "lazy"]);
		});

		it("rejects a class that implements no run", () => {
			const noRun: any = Command({ name: "dctest-class-norun" });

			assert.throws(
				() => noRun.definition,
				/Invalid command definition for 'dctest-class-norun'.*implements no 'run' method.*Accepted form:/s,
			);
		});

		describe("define-time validation", () => {
			it("rejects an unusable name at the Command() call", () => {
				assert.throws(
					() => Command({ name: "" }),
					/Invalid command definition for an unnamed command.*'name' must be/s,
				);
			});

			it("rejects an unknown meta field at the Command() call, naming it", () => {
				assert.throws(
					() => Command(<any>{ name: "dctest-class-typo", typo: 1 }),
					/Invalid command definition for 'dctest-class-typo'.*unknown field\(s\) 'typo'; Command\(\) accepts/s,
				);
			});

			it("rejects a bad option spec at the Command() call", () => {
				assert.throws(
					() =>
						Command({
							name: "dctest-class-badoption",
							options: { flag: <any>{ type: "flag" } },
						}),
					/Invalid command definition for 'dctest-class-badoption'.*option 'flag' has type 'flag'/s,
				);
			});

			it("rejects a handler passed in the meta", () => {
				assert.throws(
					() =>
						Command(<any>{
							name: "dctest-class-metahandler",
							canExecute(): boolean {
								return true;
							},
						}),
					/Invalid command definition for 'dctest-class-metahandler'.*handler\(s\) 'canExecute'; in the class form handlers are methods of the class/s,
				);
			});

			it("leaves the missing run to the first definition read", () => {
				const base: any = Command({ name: "dctest-class-lazyrun" });
				const [Anonymous] = [class extends base {}];
				class Named extends base {}

				for (const ctor of [base, Anonymous, Named]) {
					let message = "";
					try {
						ctor.definition;
					} catch (err) {
						message = err.message;
					}

					assert.match(message, /implements no 'run' method/);
					assert.notInclude(message, "'Base'");
				}

				assert.throws(() => (<any>Named).definition, /the class 'Named'/);
			});
		});

		it("reports a class Command() did not produce, through the deferred loader", () => {
			const testInjector = createTestInjector();

			class Impostor {
				public run(): void {
					/* intentionally left blank */
				}
			}

			assert.isFalse(isCommandClass(Impostor));

			runInInjectionContext(testInjector, () =>
				registerLazyCommand<any>("dctest-class-impostor2", () => <any>Impostor),
			);

			assert.throws(
				() => testInjector.resolveCommand("dctest-class-impostor2"),
				/class that did not come from Command\(\)/,
			);
		});
	});

	describe("COMMAND_CONTEXT", () => {
		it("resolves to the context the handlers of the same stage receive", async () => {
			const testInjector = createTestInjector();
			let injectedInSetup: any;
			let injectedInRun: any;
			let setupContext: any;
			let runContext: any;

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-command-context",
					setup: (ctx) => {
						setupContext = ctx;
						injectedInSetup = inject(COMMAND_CONTEXT);
					},
					run: (ctx) => {
						runContext = ctx;
						injectedInRun = inject(COMMAND_CONTEXT);
					},
				}),
				testInjector,
			);

			await command.execute([]);

			assert.strictEqual(injectedInSetup, setupContext);
			assert.strictEqual(injectedInRun, runContext);
		});

		it("hands one context object to every stage of an invocation", async () => {
			const testInjector = createTestInjector();
			const seen: any[] = [];

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-command-context-shared",
					setup: (ctx) => {
						seen.push(ctx, inject(COMMAND_CONTEXT));
					},
					canExecute: (ctx) => {
						seen.push(ctx, inject(COMMAND_CONTEXT));
						return true;
					},
					run: (ctx) => {
						seen.push(ctx, inject(COMMAND_CONTEXT));
					},
					postRun: (ctx) => {
						seen.push(ctx, inject(COMMAND_CONTEXT));
					},
				}),
				testInjector,
			);

			await command.canExecute([]);
			await command.execute([]);
			await command.postCommandAction([]);

			assert.lengthOf(seen, 8);
			for (const context of seen) {
				assert.strictEqual(context, seen[0]);
			}
		});

		it("is scoped to the invocation, so the root injector never sees it", async () => {
			const testInjector = createTestInjector();

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-command-context-scope",
					run: (): void => undefined,
				}),
				testInjector,
			);

			await command.execute([]);

			assert.isNull(testInjector.get(COMMAND_CONTEXT, { optional: true }));
			assert.throws(
				() => testInjector.get(COMMAND_CONTEXT),
				/unable to resolve/,
			);
		});

		it("gives each invocation a context of its own", async () => {
			const testInjector = createTestInjector();
			const seen: any[] = [];

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-command-context-per-invocation",
					setup: () => seen.push(inject(COMMAND_CONTEXT)),
					run: (): void => undefined,
				}),
				testInjector,
			);

			await command.execute([]);
			await command.execute([]);

			assert.lengthOf(seen, 2);
			assert.notStrictEqual(seen[0], seen[1]);
		});
	});

	describe("per-registration parameterization with a child injector", () => {
		it("registers one definition per platform and resolves the child provider", async () => {
			const PLATFORM = new InjectionToken<string>("dcTestCommandPlatform");
			const testInjector = createTestInjector({ release: true });
			const ran: string[] = [];

			const definition = defineCommand({
				name: "dctest-run",
				options: { release: booleanOption({ default: false }) },
				params: "any",
				setup: () => inject(PLATFORM),
				run: (ctx, platform) => {
					ran.push(
						`${platform}:${ctx.options.release}:${ctx.injector.get(PLATFORM)}`,
					);
				},
			});

			for (const platform of ["android", "ios"]) {
				runInInjectionContext(testInjector, () =>
					registerCommand({ ...definition, name: `dctest-run|${platform}` }, [
						{ provide: PLATFORM, useValue: platform },
					]),
				);
			}

			for (const platform of ["android", "ios"]) {
				const command = testInjector.resolveCommand(`dctest-run|${platform}`);
				assert.isTrue(await command.canExecute([]));
				await command.execute([]);
			}

			assert.deepEqual(ran, ["android:true:android", "ios:true:ios"]);
		});

		it("builds a factory provider per invocation, with the invocation in reach", async () => {
			const LABEL = new InjectionToken<{ label: string }>("dcTestLabel");
			const testInjector = createTestInjector();
			const built: string[] = [];
			const seen: any[] = [];

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-provider-sees-invocation",
						params: "any",
						run: (ctx) => {
							const first = ctx.injector.get(LABEL);
							seen.push(first, ctx.injector.get(LABEL));
						},
					}),
					[
						{
							provide: LABEL,
							useFactory: () => {
								const label = inject(COMMAND_CONTEXT).args.join("+");
								built.push(label);
								return { label };
							},
						},
					],
				),
			);

			const command = testInjector.resolveCommand(
				"dctest-provider-sees-invocation",
			);
			await command.execute(["a", "b"]);
			await command.execute(["c"]);

			assert.deepEqual(built, ["a+b", "c"]);
			assert.strictEqual(seen[0], seen[1]);
			assert.notStrictEqual(seen[0], seen[2]);
			assert.deepEqual(
				seen.map((entry) => entry.label),
				["a+b", "a+b", "c", "c"],
			);
		});
	});

	describe("providers on the definition", () => {
		it("lands in the invocation's injector, with the invocation in reach", async () => {
			const LABEL = new InjectionToken<string>("dcTestDefinitionLabel");
			const testInjector = createTestInjector();
			const seen: string[] = [];

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-definition-providers",
					params: "any",
					providers: [
						{
							provide: LABEL,
							useFactory: () => inject(COMMAND_CONTEXT).args.join("+"),
						},
					],
					run: (ctx) => {
						seen.push(inject(LABEL), ctx.injector.get(LABEL));
					},
				}),
				testInjector,
			);

			await command.execute(["a", "b"]);
			await command.execute(["c"]);

			assert.deepEqual(seen, ["a+b", "a+b", "c", "c"]);
			assert.isNotOk(testInjector.get(LABEL, { optional: true }));
		});

		it("is merged with the providers of the registration", async () => {
			const FROM_DEFINITION = new InjectionToken<string>(
				"dcTestFromDefinition",
			);
			const FROM_REGISTRATION = new InjectionToken<string>(
				"dcTestFromRegistration",
			);
			const testInjector = createTestInjector();
			let seen: string;

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-merged-providers",
						providers: [{ provide: FROM_DEFINITION, useValue: "definition" }],
						run: (ctx) => {
							seen = `${ctx.injector.get(FROM_DEFINITION)}:${ctx.injector.get(
								FROM_REGISTRATION,
							)}`;
						},
					}),
					[{ provide: FROM_REGISTRATION, useValue: "registration" }],
				),
			);

			await testInjector.resolveCommand("dctest-merged-providers").execute([]);

			assert.strictEqual(seen, "definition:registration");
		});

		it("is accepted by the class form's meta", async () => {
			const LABEL = new InjectionToken<string>("dcTestClassLabel");
			const testInjector = createTestInjector();
			let seen: string;

			class Labelled extends Command({
				name: "dctest-class-providers",
				providers: [{ provide: LABEL, useValue: "from-meta" }],
			}) {
				private $label = inject(LABEL);

				run(): void {
					seen = this.$label;
				}
			}

			await createCommandFromDefinition(
				Labelled.definition,
				testInjector,
			).execute([]);

			assert.strictEqual(seen, "from-meta");
		});

		it("takes a bare class as a provider of itself, built per invocation", async () => {
			class PerInvocation {
				public context = inject(COMMAND_CONTEXT);
			}
			const testInjector = createTestInjector();
			const seen: PerInvocation[] = [];

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-class-provider",
					params: "any",
					providers: [PerInvocation],
					run: (ctx) => {
						seen.push(inject(PerInvocation));
						assert.strictEqual(ctx.injector.get(PerInvocation), seen.at(-1));
					},
				}),
				testInjector,
			);

			await command.execute(["a"]);
			await command.execute(["b"]);

			assert.lengthOf(seen, 2);
			assert.notStrictEqual(seen[0], seen[1]);
			assert.deepEqual(seen[0].context.args, ["a"]);
			assert.deepEqual(seen[1].context.args, ["b"]);
		});

		it("must be an array of providers", () => {
			assert.throws(
				() =>
					defineCommand(<any>{
						name: "dctest-bad-providers",
						providers: { provide: "x", useValue: 1 },
						run: (): void => undefined,
					}),
				/'providers' must be an array of providers/,
			);
			assert.throws(
				() =>
					defineCommand(<any>{
						name: "dctest-bad-provider-entry",
						providers: [{ useValue: 1 }],
						run: (): void => undefined,
					}),
				/'providers' must be an array of providers/,
			);
			assert.throws(
				() =>
					defineCommand(<any>{
						name: "dctest-bad-provider-string",
						providers: ["logger"],
						run: (): void => undefined,
					}),
				/'providers' must be an array of providers/,
			);
		});
	});

	describe("required options", () => {
		const define = (canExecute: () => boolean) =>
			defineCommand({
				name: "dctest-required-option",
				options: {
					hostProjectPath: stringOption({ required: true }),
					release: booleanOption(),
				},
				params: "any",
				canExecute,
				run: (): void => undefined,
			});

		it("fails before canExecute when a required option is missing", async () => {
			let consulted = false;
			const command = createCommandFromDefinition(
				define(() => (consulted = true)),
				createTestInjector({ release: true }),
			);

			await assert.isRejected(
				command.canExecute(["a"]),
				/The option '--host-project-path' is required\./,
			);
			assert.isFalse(consulted);
		});

		it("passes when the option is present", async () => {
			let seen: string;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-required-present",
					options: { hostProjectPath: stringOption({ required: true }) },
					run: (ctx) => {
						seen = ctx.options.hostProjectPath.toUpperCase();
					},
				}),
				createTestInjector({ hostProjectPath: "host" }),
			);

			assert.isTrue(await command.canExecute([]));
			await command.execute([]);
			assert.strictEqual(seen, "HOST");
		});
	});

	describe("COMMAND_PRECONDITIONS", () => {
		it("names the command when an entry is not a function", async () => {
			const testInjector = createTestInjector();
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-precondition-shape",
					params: "none",
					providers: [
						{
							provide: COMMAND_PRECONDITIONS,
							multi: true,
							useValue: ["not a check"],
						},
					],
					run: (): void => undefined,
				}),
				testInjector,
			);

			await assert.isRejected(
				command.execute([]),
				/Command 'dctest-precondition-shape': COMMAND_PRECONDITIONS entry #1 is not a function/,
			);
		});

		it("replaces the scope's preconditions with the command's own, unless the command keeps them", async () => {
			const order: string[] = [];
			const scope = (<any>createTestInjector()).createChild([
				{
					provide: COMMAND_PRECONDITIONS,
					multi: true,
					useValue: () => order.push("scope"),
				},
			]);
			const own = {
				provide: COMMAND_PRECONDITIONS,
				multi: true,
				useValue: () => order.push("own"),
			};
			const keepScope = {
				provide: COMMAND_PRECONDITIONS,
				multi: true,
				useFactory: () =>
					inject(COMMAND_PRECONDITIONS, { skipSelf: true, optional: true }) ||
					[],
			};

			await createCommandFromDefinition(
				defineCommand({
					name: "dctest-preconditions-shadow",
					params: "none",
					providers: [own],
					run: (): void => undefined,
				}),
				scope,
			).execute([]);
			assert.deepEqual(order, ["own"]);

			order.length = 0;
			await createCommandFromDefinition(
				defineCommand({
					name: "dctest-preconditions-inherit",
					params: "none",
					providers: [keepScope, own],
					run: (): void => undefined,
				}),
				scope,
			).execute([]);
			assert.deepEqual(order, ["scope", "own"]);
		});

		it("runs the preconditions in order, before setup and before the arguments policy", async () => {
			const testInjector = createTestInjector();
			const order: string[] = [];

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-preconditions",
					params: "none",
					providers: [
						{
							provide: COMMAND_PRECONDITIONS,
							multi: true,
							useValue: (ctx: CommandContext) => {
								order.push(`first:${inject(COMMAND_CONTEXT) === ctx}`);
							},
						},
						{
							provide: COMMAND_PRECONDITIONS,
							multi: true,
							useValue: async () => {
								await Promise.resolve();
								order.push("second");
								throw new Error("not in a project");
							},
						},
					],
					setup: () => {
						order.push("setup");
					},
					run: () => {
						order.push("run");
					},
				}),
				testInjector,
			);

			await assert.isRejected(
				command.canExecute(["stray"]),
				/not in a project/,
			);

			assert.deepEqual(order, ["first:true", "second"]);
		});

		it("lets setup start synchronously when there are none", async () => {
			const testInjector = createTestInjector();
			let setupRan = false;

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-no-preconditions",
					setup: () => {
						setupRan = true;
					},
					run: (): void => undefined,
				}),
				testInjector,
			);

			const verdict = command.canExecute([]);
			assert.isTrue(setupRan);
			assert.isTrue(await verdict);
		});
	});

	describe("option groups", () => {
		describe("defineOptions", () => {
			it("returns a token named after the group that carries its schema", () => {
				const schema = { watch: booleanOption() };
				const group = defineOptions("dctest-grp-basic", schema);

				assert.isTrue(isOptionsGroup(group));
				assert.instanceOf(group, InjectionToken);
				assert.strictEqual(group.groupName, "dctest-grp-basic");
				assert.strictEqual(group.schema, schema);
				assert.strictEqual(group.description, "options:dctest-grp-basic");
				assert.isTrue(group[OPTIONS_GROUP_MARKER]);
				assert.isFalse(isOptionsGroup(schema));
				assert.isFalse(isOptionsGroup(null));
				assert.isFalse(isOptionsGroup(new InjectionToken("dctest-grp-plain")));
			});

			it("keys the same injector record as its registry name", () => {
				const group = defineOptions("dctest-grp-byname", {
					watch: booleanOption(),
				});
				const testInjector = createTestInjector();
				testInjector.register({ provide: group, useValue: { watch: true } });

				assert.deepEqual(testInjector.resolve("options:dctest-grp-byname"), {
					watch: true,
				});
				assert.deepEqual(testInjector.get(group), { watch: true });
			});

			it("rejects an unusable name, schema or spec, naming the group", () => {
				assert.throws(
					() => defineOptions("", {}),
					/^Invalid option group \(unnamed\): the name must be a non-empty string\. Accepted form: defineOptions/,
				);
				assert.throws(
					() => defineOptions("dctest-grp-noschema", <any>null),
					/^Invalid option group 'dctest-grp-noschema': the schema must be an object keyed by the long option name/,
				);
				assert.throws(
					() =>
						defineOptions("dctest-grp-badspec", <any>{
							watch: { type: "bool" },
						}),
					/^Invalid option group 'dctest-grp-badspec': option 'watch' has type 'bool'/,
				);
			});

			it("rejects a spelling two of its options would share", () => {
				assert.throws(
					() =>
						defineOptions("dctest-grp-aliasclash", {
							watch: booleanOption(),
							wait: booleanOption({ alias: "watch" }),
						}),
					/^Invalid option group 'dctest-grp-aliasclash': alias '-watch' of '--wait' \(option group 'dctest-grp-aliasclash'\) is already the spelling of '--watch' \(option group 'dctest-grp-aliasclash'\)/,
				);
				assert.throws(
					() =>
						defineOptions("dctest-grp-nameclash", {
							watch: booleanOption({ alias: "w" }),
							w: booleanOption(),
						}),
					/^Invalid option group 'dctest-grp-nameclash': option '--w' \(option group 'dctest-grp-nameclash'\) is already an alias of '--watch' \(option group 'dctest-grp-nameclash'\)/,
				);
			});

			it("refuses a second group under a name already in use", () => {
				defineOptions("dctest-grp-dup", {});

				assert.throws(
					() => defineOptions("dctest-grp-dup", {}),
					/Token name 'options:dctest-grp-dup' is already used/,
				);
			});
		});

		describe("options as a list", () => {
			const runOptionsFor = (name: string) =>
				defineOptions(name, {
					watch: booleanOption({ default: true }),
					device: stringOption({ alias: "d" }),
				});

			it("merges the groups and the inline specs onto ctx.options", async () => {
				const RunOptions = runOptionsFor("dctest-grp-merge");
				const testInjector = createTestInjector({
					watch: false,
					device: "emulator-5554",
					extra: true,
					undeclared: "ignored",
				});

				let seen: any;
				const command = createCommandFromDefinition(
					defineCommand({
						name: "dctest-grp-merge",
						options: [RunOptions, { extra: booleanOption() }],
						run: (ctx) => {
							seen = ctx.options;
						},
					}),
					testInjector,
				);
				await command.execute([]);

				assert.deepEqual(seen, {
					watch: false,
					device: "emulator-5554",
					extra: true,
				});
			});

			it("compiles every part into dashedOptions", () => {
				const RunOptions = runOptionsFor("dctest-grp-dashed");
				const command = createCommandFromDefinition(
					defineCommand({
						name: "dctest-grp-dashed",
						options: [RunOptions, { extra: booleanOption() }],
						run: (): void => undefined,
					}),
					createTestInjector(),
				);

				assert.deepEqual(command.dashedOptions, {
					watch: { type: "boolean", hasSensitiveValue: false, default: true },
					device: { type: "string", hasSensitiveValue: false, alias: "d" },
					extra: { type: "boolean", hasSensitiveValue: false },
				});
			});

			it("provides each group's slice to the invocation, not to the target injector", async () => {
				const RunOptions = runOptionsFor("dctest-grp-provide");
				const testInjector = createTestInjector({
					watch: false,
					device: "emulator-5554",
					extra: true,
				});
				const DEVICE = new InjectionToken<string>("dctest-grp-provide-device");
				const seen: any[] = [];

				const command = createCommandFromDefinition(
					defineCommand({
						name: "dctest-grp-provide",
						options: [RunOptions, { extra: booleanOption() }],
						providers: [
							{ provide: DEVICE, useFactory: () => inject(RunOptions).device },
						],
						setup: () => {
							seen.push(["setup", inject(RunOptions)]);
						},
						canExecute: (ctx) => {
							seen.push(["canExecute", ctx.injector.get(RunOptions)]);
							return true;
						},
						run: (ctx) => {
							seen.push(["run", inject(RunOptions)]);
							seen.push(["service", ctx.injector.get(DEVICE)]);
						},
					}),
					testInjector,
				);

				assert.isTrue(await command.canExecute([]));
				await command.execute([]);

				const slice = { watch: false, device: "emulator-5554" };
				assert.deepEqual(seen, [
					["setup", slice],
					["canExecute", slice],
					["run", slice],
					["service", "emulator-5554"],
				]);
				assert.isNull(testInjector.get(RunOptions, { optional: true }));
			});

			it("reads the group's values again for every invocation", async () => {
				const RunOptions = runOptionsFor("dctest-grp-fresh");
				const optionsService: any = { watch: false, device: "a" };
				const testInjector = createTestInjector(optionsService);
				const seen: any[] = [];

				const command = createCommandFromDefinition(
					defineCommand({
						name: "dctest-grp-fresh",
						options: [RunOptions],
						run: () => {
							seen.push(inject(RunOptions));
						},
					}),
					testInjector,
				);

				await command.execute([]);
				optionsService.watch = true;
				optionsService.device = "b";
				await command.execute([]);

				assert.deepEqual(seen, [
					{ watch: false, device: "a" },
					{ watch: true, device: "b" },
				]);
			});
		});

		describe("collisions", () => {
			it("rejects one long name declared by two parts with different specs", () => {
				const Shared = defineOptions("dctest-grp-clash", {
					watch: booleanOption({ default: true }),
				});
				const Other = defineOptions("dctest-grp-clash-other", {
					watch: booleanOption(),
				});

				assert.throws(
					() =>
						defineCommand({
							name: "dctest-grp-clash-inline",
							options: [Shared, { watch: booleanOption() }],
							run: (): void => undefined,
						}),
					/^Invalid command definition for 'dctest-grp-clash-inline': option '--watch' is declared by option group 'dctest-grp-clash' and by the command's own options with different specs/,
				);
				assert.throws(
					() =>
						defineCommand({
							name: "dctest-grp-clash-groups",
							options: [Shared, Other],
							run: (): void => undefined,
						}),
					/option '--watch' is declared by option group 'dctest-grp-clash' and by option group 'dctest-grp-clash-other' with different specs/,
				);
			});

			it("treats a different alias, default or sensitivity as a different spec", () => {
				const Output = defineOptions("dctest-grp-clash-spec", {
					output: stringOption({ alias: "o" }),
				});

				for (const redeclared of [
					stringOption({ alias: "O" }),
					stringOption({ alias: "o", hasSensitiveValue: true }),
					stringOption({ alias: "o", default: "dist" }),
				]) {
					assert.throws(
						() =>
							defineCommand({
								name: "dctest-grp-clash-spec",
								options: [Output, { output: redeclared }],
								run: (): void => undefined,
							}),
						/option '--output' is declared by option group 'dctest-grp-clash-spec' and by the command's own options with different specs/,
					);
				}
			});

			it("accepts the same spec declared by two parts", () => {
				const Output = defineOptions("dctest-grp-same", {
					output: stringOption({ alias: "o" }),
				});

				const command = createCommandFromDefinition(
					defineCommand({
						name: "dctest-grp-same",
						options: [Output, { output: stringOption({ alias: "o" }) }],
						run: (): void => undefined,
					}),
					createTestInjector(),
				);

				assert.deepEqual(command.dashedOptions, {
					output: { type: "string", hasSensitiveValue: false, alias: "o" },
				});
			});

			it("rejects an alias of one part that is a spelling of another", () => {
				const Output = defineOptions("dctest-grp-alias", {
					output: stringOption({ alias: "o" }),
				});

				assert.throws(
					() =>
						defineCommand({
							name: "dctest-grp-alias",
							options: [Output, { target: stringOption({ alias: "output" }) }],
							run: (): void => undefined,
						}),
					/alias '-output' of '--target' \(the command's own options\) is already the spelling of '--output' \(option group 'dctest-grp-alias'\)/,
				);
				assert.throws(
					() =>
						defineCommand({
							name: "dctest-grp-alias",
							options: [Output, { o: booleanOption() }],
							run: (): void => undefined,
						}),
					/option '--o' \(the command's own options\) is already an alias of '--output' \(option group 'dctest-grp-alias'\)/,
				);
			});

			it("applies the same rules to the Command() meta", () => {
				const Watch = defineOptions("dctest-grp-clash-class", {
					watch: booleanOption({ default: true }),
				});

				assert.throws(
					() =>
						Command({
							name: "dctest-grp-clash-class",
							options: [Watch, { watch: booleanOption() }],
						}),
					/^Invalid command definition for 'dctest-grp-clash-class': option '--watch' is declared by option group 'dctest-grp-clash-class'/,
				);
			});
		});

		describe("process-level options", () => {
			const compile = (options: any) =>
				createCommandFromDefinition(
					defineCommand({
						name: "dctest-grp-root",
						options,
						run: (): void => undefined,
					}),
					createTestInjector(),
				);

			it("refuses an inline option that redeclares a CliOptions name", () => {
				assert.throws(
					() => compile({ path: stringOption() }),
					"Command 'dctest-grp-root': '--path' is a process-level option; list CliOptions under 'options', or inject it, instead of redeclaring it",
				);
			});

			it("refuses an alias that is a CliOptions shorthand", () => {
				assert.throws(
					() => compile({ project: stringOption({ alias: "p" }) }),
					"Command 'dctest-grp-root': '-p' is a process-level option",
				);
			});

			it("refuses a group of the command's own that redeclares one", () => {
				const Logging = defineOptions("dctest-grp-root-group", {
					verbose: booleanOption(),
				});

				assert.throws(
					() => compile([Logging]),
					"Command 'dctest-grp-root': '--verbose' is a process-level option",
				);
			});

			it("lets CliOptions itself be listed, reading its values onto ctx.options", async () => {
				const testInjector = createTestInjector({
					verbose: true,
					path: "/app",
					output: "dist",
				});

				let seen: any;
				const command = createCommandFromDefinition(
					defineCommand({
						name: "dctest-grp-root-listed",
						options: [CliOptions, { output: stringOption() }],
						run: (ctx) => {
							seen = ctx.options;
						},
					}),
					testInjector,
				);
				await command.execute([]);

				assert.sameMembers(Object.keys(seen), [
					...Object.keys(CliOptions.schema),
					"output",
				]);
				assert.isTrue(seen.verbose);
				assert.strictEqual(seen.path, "/app");
				assert.strictEqual(seen.output, "dist");
				assert.deepEqual(command.dashedOptions.path, {
					type: "string",
					hasSensitiveValue: true,
					alias: "p",
				});
			});

			it("does not provide CliOptions per invocation", async () => {
				const Extra = defineOptions("dctest-grp-root-extra", {
					extra: booleanOption(),
				});
				const testInjector = createTestInjector({ verbose: true, extra: true });

				let provided: any[];
				const command = createCommandFromDefinition(
					defineCommand({
						name: "dctest-grp-root-unprovided",
						options: [CliOptions, Extra],
						run: (ctx) => {
							provided = [
								ctx.injector.get(CliOptions, { optional: true }),
								ctx.injector.get(Extra, { optional: true }),
							];
						},
					}),
					testInjector,
				);
				await command.execute([]);

				assert.deepEqual(provided, [null, { extra: true }]);
			});
		});

		describe("class form", () => {
			it("types and merges this.options from a list of groups and specs", async () => {
				const RunOptions = defineOptions("dctest-grp-class", {
					watch: booleanOption({ default: true }),
					device: stringOption(),
				});
				const testInjector = createTestInjector({
					watch: false,
					device: "emulator-5554",
					extra: true,
				});
				const seen: any[] = [];

				class GroupedWidget extends Command({
					name: "dctest-grp-class",
					options: [RunOptions, { extra: booleanOption({ default: false }) }],
				}) {
					private runOptions = inject(RunOptions);

					public run(): void {
						const watch: boolean = this.options.watch;
						const extra: boolean = this.options.extra;
						seen.push([watch, this.options.device, extra], this.runOptions);
					}
				}

				const command = createCommandFromDefinition(
					GroupedWidget.definition,
					testInjector,
				);
				await command.execute([]);

				assert.deepEqual(seen, [
					[false, "emulator-5554", true],
					{ watch: false, device: "emulator-5554" },
				]);
			});
		});
	});
});
