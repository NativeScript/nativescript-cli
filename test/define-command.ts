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
import {
	COMMAND_OWNER,
	CommandRegistry,
	DeferredCommandResult,
} from "../lib/common/contracts/command-registry";
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
	registerCommand,
	registerLazyCommand,
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
				/'arguments' is 'one'; it must be "none", "any" or an array of argument specs/,
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
			assert.strictEqual(seenInjector, scope);

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

		it("carries over what a redeclared CLI option leaves unspecified", () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestredeclare",
					options: {
						// Redeclared only to give this command its own default.
						path: stringOption({ default: "./here" }),
						watch: booleanOption({ default: false }),
					},
					run: (): void => undefined,
				}),
				createTestInjector({
					options: {
						path: { type: "string", alias: "p", hasSensitiveValue: true },
						watch: { type: "boolean", hasSensitiveValue: false },
					},
				}),
			);

			assert.deepEqual(command.dashedOptions, {
				path: {
					type: "string",
					hasSensitiveValue: true,
					default: "./here",
					alias: "p",
				},
				watch: { type: "boolean", hasSensitiveValue: false, default: false },
			});
		});

		it("lets a redeclaration override what it does specify", () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestoverride",
					options: {
						path: stringOption({ alias: "q", hasSensitiveValue: false }),
					},
					run: (): void => undefined,
				}),
				createTestInjector({
					options: {
						path: { type: "string", alias: "p", hasSensitiveValue: true },
					},
				}),
			);

			assert.deepEqual(command.dashedOptions, {
				path: { type: "string", hasSensitiveValue: false, alias: "q" },
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
						verbose: stringOption(),
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

		it("stays quiet when a command only redefines a CLI-wide option's default", () => {
			const testInjector = createTestInjector({
				options: {
					watch: { type: "boolean" },
					path: { type: "string", alias: "p" },
				},
			});

			createCommandFromDefinition(
				defineCommand({
					name: "dctestredeclare",
					options: {
						watch: booleanOption({ default: true }),
						path: stringOption({ alias: "p" }),
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
			const testInjector = createCommandsServiceInjector({ verbose: true });
			let ran: any;

			runInInjectionContext(testInjector, () =>
				registerCommand(
					defineCommand({
						name: "dctest-e2e",
						options: { verbose: booleanOption({ default: false }) },
						arguments: "any",
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
				verbose: { type: "boolean", hasSensitiveValue: false, default: false },
			});
			assert.deepEqual(ran.args, ["alpha"]);
			assert.deepEqual(ran.options, { verbose: true });
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
						arguments: "any",
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
						arguments: "any",
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

	describe("positional argument specs", () => {
		const platformCommand = (extra: any = {}) =>
			createCommandFromDefinition(
				defineCommand({
					name: "dctest-positional",
					arguments: [
						{ name: "platform", required: true },
						{ name: "target" },
						...(extra.variadic ? [{ name: "rest", variadic: true }] : []),
					],
					run: (ctx) => {
						extra.seen = ctx.arguments;
					},
				}),
				createTestInjector(),
			);

		it("maps arguments onto ctx.arguments strictly by position", async () => {
			const extra: any = {};
			const command = platformCommand(extra);

			assert.isTrue(await command.canExecute(["android", "device"]));
			await command.execute(["android", "device"]);

			assert.deepEqual(extra.seen, { platform: "android", target: "device" });
		});

		it("leaves an unfilled optional argument off ctx.arguments", async () => {
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

		it("exposes an empty ctx.arguments when no specs are declared", async () => {
			let seen: any;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-noargspecs",
					arguments: "any",
					run: (ctx) => {
						seen = ctx.arguments;
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
					arguments: [
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
					arguments: [{ name: "files", required: true, variadic: true }],
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
					arguments: [{ name: "platform" }],
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
					arguments: [],
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
					arguments: [
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
					arguments: [{ name: "platform", validate: () => false }],
					run: (): void => undefined,
				}),
				createTestInjector(),
			);

			await assert.isRejected(
				command.canExecute(["ios"]),
				/The parameter 'ios' is not valid for 'platform'\./,
			);
		});

		it("hands validate the command context", async () => {
			const testInjector = createTestInjector({ force: true });
			let capturedContext: any;

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-validate-ctx",
					options: { force: booleanOption() },
					arguments: [
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
			assert.deepEqual(capturedContext.arguments, { platform: "android" });
		});

		it("enforces the specs before consulting the definition canExecute", async () => {
			let refined = false;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-specs-first",
					arguments: [{ name: "platform", required: true }],
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
						arguments: specs,
						run: (): void => undefined,
					}),
				expected,
			);

		it("rejects a spec that is not an object, or has no name", () => {
			rejects(["platform"], /argument #1 of 'arguments' must be an object/);
			rejects(
				[{ required: true }],
				/argument #1 of 'arguments' has no usable 'name'/,
			);
			rejects(
				[{ name: "  " }],
				/argument #1 of 'arguments' has no usable 'name'/,
			);
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
				/'arguments' declares 'platform' twice/,
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
				/argument 'device' is required but follows the optional 'platform'/,
			);
		});

		it("accepts a well-formed spec array", () => {
			assert.doesNotThrow(() =>
				defineCommand({
					name: "dctest-spec-ok",
					arguments: [
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
					arguments: "any",
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
						arguments: "any",
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

		it("scopes the command to a child injector built on first resolution", async () => {
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
			assert.strictEqual(children, 1);

			await command.execute([]);
			assert.strictEqual(seen, "hello");
			// The provider lives in the command's own scope, not the injector the
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
			assert.strictEqual(seenInjector, scope);

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
		it("is the injector the command was registered against", async () => {
			const testInjector = createTestInjector();
			let seen: any;

			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctest-injector",
					run: (ctx) => {
						seen = ctx.injector;
					},
				}),
				testInjector,
			);

			await command.execute([]);

			assert.strictEqual(seen, testInjector);
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

	describe("per-registration parameterization with a child injector", () => {
		it("registers one definition per platform and resolves the child provider", async () => {
			const PLATFORM = new InjectionToken<string>("dcTestCommandPlatform");
			const testInjector = createTestInjector({ release: true });
			const ran: string[] = [];

			const definition = defineCommand({
				name: "dctest-run",
				options: { release: booleanOption({ default: false }) },
				arguments: "any",
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
	});
});
