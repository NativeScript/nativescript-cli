import { assert } from "chai";
import { Yok } from "../lib/common/yok";
import { IInjector } from "../lib/common/definitions/yok";
import { inject } from "../lib/common/di";
import { CommandsService } from "../lib/common/services/commands-service";
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

type IsExact<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? true
		: false;

/** Fails to compile unless the schema inferred exactly the expected type. */
const expectExactType = <T extends true>(): void => undefined;

const createTestInjector = (options: any = {}): IInjector => {
	const testInjector = new Yok();
	testInjector.register("options", options);
	return testInjector;
};

describe("defineCommand", () => {
	it("marks definitions so a duplicated CLI copy still recognises them", () => {
		const definition = defineCommand({
			name: "dctest-marker",
			run: () => undefined,
		});

		assert.isTrue(isCommandDefinition(definition));
		assert.isTrue(
			(<any>definition)[Symbol.for("nativescript:cli:commandDefinition")],
		);
		assert.isFalse(isCommandDefinition({ name: "dctest-marker" }));
		assert.isFalse(isCommandDefinition(null));
	});

	describe("registration", () => {
		it("round-trips through the legacy command registry", () => {
			const definition = defineCommand({
				name: "dctestwidget|add",
				description: "Adds a widget",
				run: () => undefined,
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
				defineCommand({ name: "dctestflat", run: () => undefined }),
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
					run: () => undefined,
				}),
				testInjector,
			);

			assert.isFunction(testInjector.resolveCommand("dctestalias").execute);
			assert.isFunction(testInjector.resolveCommand("dctestalias2").execute);
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

		it("infers the option value types on the run context", async () => {
			const testInjector = createTestInjector({
				verbose: true,
				output: "dist",
				retries: 3,
				files: ["a.ts"],
			});

			let verbose: boolean;
			let output: string;
			let retries: number;
			let files: string[];

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
						expectExactType<IsExact<typeof context.options.verbose, boolean>>();
						expectExactType<IsExact<typeof context.options.output, string>>();
						expectExactType<IsExact<typeof context.options.retries, number>>();
						expectExactType<IsExact<typeof context.options.files, string[]>>();

						verbose = context.options.verbose;
						output = context.options.output;
						retries = context.options.retries;
						files = context.options.files;
					},
				}),
				testInjector,
			);

			await command.execute([]);

			assert.isTrue(verbose);
			assert.strictEqual(output, "dist");
			assert.strictEqual(retries, 3);
			assert.deepEqual(files, ["a.ts"]);
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
					run: () => undefined,
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
				defineCommand({ name: "dctestnoopts", run: () => undefined }),
				createTestInjector(),
			);

			assert.deepEqual(command.dashedOptions, {});
		});
	});

	describe("canExecute", () => {
		it("is omitted for argument-less commands so the framework rejects parameters", () => {
			const testInjector = createTestInjector();

			const implicit = createCommandFromDefinition(
				defineCommand({ name: "dctestnone", run: () => undefined }),
				testInjector,
			);
			const explicit = createCommandFromDefinition(
				defineCommand({
					name: "dctestnone2",
					arguments: "none",
					run: () => undefined,
				}),
				testInjector,
			);

			assert.isUndefined(implicit.canExecute);
			assert.isUndefined(explicit.canExecute);
			assert.deepEqual(implicit.allowedParameters, []);
			assert.deepEqual(explicit.allowedParameters, []);
		});

		it("accepts anything when arguments are 'any'", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestany",
					arguments: "any",
					run: () => undefined,
				}),
				createTestInjector(),
			);

			assert.isFunction(command.canExecute);
			assert.isTrue(await command.canExecute(["whatever", "else"]));
		});

		it("hands the context to a user canExecute and honours its verdict", async () => {
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
						run: () => undefined,
					}),
					testInjector,
				);

			assert.isTrue(await build(true).canExecute(["android"]));
			assert.deepEqual(capturedContext.args, ["android"]);
			assert.deepEqual(capturedContext.options, { force: true });

			assert.isFalse(await build(false).canExecute(["android"]));
		});

		it("is emitted for a user canExecute even when arguments are 'none'", async () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestnonecan",
					arguments: "none",
					canExecute: async () => true,
					run: () => undefined,
				}),
				createTestInjector(),
			);

			assert.isFunction(command.canExecute);
			assert.isTrue(await command.canExecute([]));
		});
	});

	describe("command flags", () => {
		it("passes disableAnalytics and enableHooks through", () => {
			const command = createCommandFromDefinition(
				defineCommand({
					name: "dctestflags",
					disableAnalytics: true,
					enableHooks: false,
					run: () => undefined,
				}),
				createTestInjector(),
			);

			assert.isTrue(command.disableAnalytics);
			assert.isFalse(command.enableHooks);
		});

		it("leaves both absent when the definition omits them", () => {
			const command = createCommandFromDefinition(
				defineCommand({ name: "dctestnoflags", run: () => undefined }),
				createTestInjector(),
			);

			assert.isFalse("disableAnalytics" in command);
			assert.isFalse("enableHooks" in command);
		});
	});

	describe("end to end through CommandsService", () => {
		let validatedOptions: any;

		const createCommandsServiceInjector = (options: any): IInjector => {
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

		it("lets the framework reject parameters when arguments are 'none'", async () => {
			const testInjector = createCommandsServiceInjector({});
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
	});
});
