import { assert } from "chai";
import { spawnSync } from "child_process";
import * as path from "path";
import { Yok } from "../lib/common/yok";
import { IInjector } from "../lib/common/definitions/yok";
import { inject } from "../lib/common/di";
import { CommandRegistry } from "../lib/common/contracts/command-registry";
import { CommandsService } from "../lib/common/services/commands-service";
import { Options } from "../lib/options";
import { Errors } from "../lib/common/errors";
import { LoggerStub, HooksServiceStub } from "./stubs";
import {
	arrayOption,
	booleanOption,
	defineCommand,
	isCommandDefinition,
	numberOption,
	stringOption,
} from "../lib/common/define-command";
import {
	createCommandFromDefinition,
	registerCommandDefinition,
} from "../lib/common/services/command-definition-adapter";

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

		it("rejects an unusable arguments policy", () => {
			rejects(
				{ name: "dctest-args", arguments: "one", run: (): void => undefined },
				/'arguments' is 'one'; it must be "none" or "any"/,
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
					arguments: "any",
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

			assert.strictEqual(
				result.status,
				0,
				`${result.stdout || ""}${result.stderr || ""}`,
			);
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
			registerCommandDefinition(definition, testInjector);

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
			registerCommandDefinition(
				defineCommand({ name: "dctestflat", run: (): void => undefined }),
				testInjector,
			);

			assert.strictEqual(
				testInjector.resolveCommand("dctestflat"),
				testInjector.resolveCommand("dctestflat"),
			);
		});

		it("registers every alias of a multi-name definition", () => {
			const testInjector = createTestInjector();
			registerCommandDefinition(
				defineCommand({
					name: ["dctestalias", "dctestalias2"],
					run: (): void => undefined,
				}),
				testInjector,
			);

			assert.isFunction(testInjector.resolveCommand("dctestalias").execute);
			assert.isFunction(testInjector.resolveCommand("dctestalias2").execute);
		});

		it("refuses a value that did not come from defineCommand", () => {
			assert.throws(
				() =>
					registerCommandDefinition(
						<any>{ name: "dctestraw", run: (): void => undefined },
						createTestInjector(),
					),
				/carries no command-definition marker/,
			);
		});

		it("registers through the CommandRegistry the target injector provides", () => {
			const testInjector = createTestInjector();
			const registered: string[] = [];
			testInjector.register({
				provide: CommandRegistry,
				useValue: {
					registerCommand: (name: string) => registered.push(name),
				},
			});

			registerCommandDefinition(
				defineCommand({
					name: ["dctestfacet", "dctestfacet2"],
					run: (): void => undefined,
				}),
				testInjector,
			);

			assert.deepEqual(registered, ["dctestfacet", "dctestfacet2"]);
			assert.isNull(testInjector.resolveCommand("dctestfacet"));
		});

		it("keeps a registered command when a subcommand would shadow it", () => {
			const testInjector = createTestInjector();
			registerCommandDefinition(
				defineCommand({ name: "dctestowned", run: (): void => undefined }),
				testInjector,
			);

			registerCommandDefinition(
				defineCommand({ name: "dctestowned|sub", run: (): void => undefined }),
				testInjector,
			);

			const owner = testInjector.resolveCommand("dctestowned");
			assert.isUndefined(owner.isHierarchicalCommand);
			assert.isFunction(testInjector.resolveCommand("dctestowned|sub").execute);

			const logger: LoggerStub = testInjector.resolve("logger");
			assert.match(
				logger.warnOutput,
				/'dctestowned' is already registered as a command of its own.*'dctestowned\|sub' cannot be reached/,
			);
		});
	});

	describe("execute", () => {
		it("passes args and the declared options through, inside an injection context", async () => {
			const testInjector = createTestInjector({
				verbose: true,
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
						verbose: booleanOption(),
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
			assert.deepEqual(capturedOptions, { verbose: true, output: "dist" });
			assert.strictEqual(greeting, "hello");
		});

		it("reads option values at execution time", async () => {
			const optionsService: any = { verbose: false };
			const testInjector = createTestInjector(optionsService);

			let seen: boolean;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestlate",
					options: { verbose: booleanOption() },
					run: (context) => {
						seen = context.options.verbose;
					},
				}),
				testInjector,
			);

			optionsService.verbose = true;
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
				verbose: true,
				output: "dist",
				retries: 3,
				files: ["a.ts"],
			});

			let seen: any;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctesttypes",
					options: {
						verbose: booleanOption(),
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
				verbose: true,
				output: "dist",
				retries: 3,
				files: ["a.ts"],
			});
		});
	});

	describe("dashedOptions", () => {
		it("compiles the schema into the shape the option parser expects", () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestdashed",
					options: {
						verbose: booleanOption({ default: false }),
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
				verbose: { type: "boolean", hasSensitiveValue: false, default: false },
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
					verbose: { type: "boolean" },
					path: { type: "string", alias: "p" },
				},
			});

			createCommandFromDefinition(
				defineCommand({
					name: "dctestshadow",
					options: {
						verbose: booleanOption(),
						output: stringOption({ alias: ["p", "o"] }),
						fresh: booleanOption({ alias: "f" }),
					},
					run: (): void => undefined,
				}),
				testInjector,
			);

			const logger: LoggerStub = testInjector.resolve("logger");
			assert.include(
				logger.warnOutput,
				"'--verbose' with the CLI option '--verbose'",
			);
			assert.include(
				logger.warnOutput,
				"alias '-p' of '--output' with the CLI option '--path'",
			);
			assert.notInclude(logger.warnOutput, "--fresh");
			assert.notInclude(logger.warnOutput, "'-o'");
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
					arguments: "none",
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
					arguments: "any",
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
						arguments: "any",
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
					arguments: "any",
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
					arguments: "any",
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
				return { failures, options };
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
			const testInjector = createCommandsServiceInjector({ verbose: true });
			let ran: any;

			registerCommandDefinition(
				defineCommand({
					name: "dctest-e2e",
					options: { verbose: booleanOption({ default: false }) },
					arguments: "any",
					run: (context) => {
						ran = context;
					},
				}),
				testInjector,
			);

			const commandsService: ICommandsService =
				testInjector.resolve("commandsService");
			await commandsService.tryExecuteCommand("dctest-e2e", ["alpha"]);

			assert.deepEqual(validatedOptions, {
				verbose: { type: "boolean", hasSensitiveValue: false, default: false },
			});
			assert.deepEqual(ran.args, ["alpha"]);
			assert.deepEqual(ran.options, { verbose: true });
		});

		it("rejects parameters when arguments are 'none'", async () => {
			const testInjector = createCommandsServiceInjector();
			let ran = false;

			registerCommandDefinition(
				defineCommand({
					name: "dctest-e2e-none",
					run: () => {
						ran = true;
					},
				}),
				testInjector,
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

			registerCommandDefinition(
				defineCommand({
					name: "dctest-e2e-refine",
					canExecute: () => true,
					run: () => {
						ran = true;
					},
				}),
				testInjector,
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

			registerCommandDefinition(
				defineCommand({
					name: "dctest-widget|add",
					arguments: "any",
					run: (context) => {
						ran = context;
					},
				}),
				testInjector,
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

			registerCommandDefinition(
				defineCommand({
					name: "dctest-gadget|*all",
					arguments: "any",
					run: (context) => {
						runs.push(context.args);
					},
				}),
				testInjector,
			);

			const commandsService: ICommandsService =
				testInjector.resolve("commandsService");
			await commandsService.tryExecuteCommand("dctest-gadget", ["all", "beta"]);
			await commandsService.tryExecuteCommand("dctest-gadget", []);

			assert.deepEqual(runs, [["beta"], []]);
		});
	});
});
