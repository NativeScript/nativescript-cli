import { assert } from "chai";
import * as util from "util";
import { Yok } from "../../lib/common/yok";
import { IInjector } from "../../lib/common/definitions/yok";
import { inject, runInInjectionContext } from "../../lib/common/di";
import { COMMAND_OWNER } from "../../lib/common/contracts/command-registry";
import { CommandsService } from "../../lib/common/services/commands-service";
import { HooksService } from "../../lib/common/services/hooks-service";
import { defineCommand, stringOption } from "../../lib/common/define-command";
import { registerCommand } from "../../lib/common/services/command-definition-adapter";
import { Options } from "../../lib/options";
import { LoggerStub } from "../stubs";

// The name the real hooks service turns a dispatched command name into.
const formatHookName = (commandName: string): string =>
	(<any>HooksService).formatHookName(commandName);

interface IDispatchHarness {
	injector: IInjector;
	commandsService: ICommandsService;
	hooks: string[];
	beginCommandCalls: number;
	consentChecks: number;
}

const createHarness = (
	opts: { disableCommandHooks?: boolean; realOptions?: boolean } = {},
): IDispatchHarness => {
	const testInjector = new Yok();
	const harness = <IDispatchHarness>(<unknown>{
		injector: testInjector,
		hooks: [],
		beginCommandCalls: 0,
		consentChecks: 0,
	});
	const fail = (message: string, ...args: any[]): never => {
		throw new Error(util.format(message, ...args));
	};

	testInjector.register("errors", {
		beginCommand: async (action: () => Promise<boolean>) => {
			harness.beginCommandCalls++;
			return action();
		},
		failWithHelp: fail,
		fail,
		reportCommandError: async (): Promise<void> => undefined,
	});
	testInjector.register("hooksService", {
		hookArgsName: "hookArgs",
		executeBeforeHooks: async (commandName: string): Promise<unknown[]> => {
			harness.hooks.push(`before-${formatHookName(commandName)}`);
			return [];
		},
		executeAfterHooks: async (commandName: string) => {
			harness.hooks.push(`after-${formatHookName(commandName)}`);
		},
	});
	testInjector.register("analyticsService", {
		checkConsent: async () => {
			harness.consentChecks++;
		},
		trackInGoogleAnalytics: async (): Promise<void> => undefined,
	});
	testInjector.register("logger", LoggerStub);
	testInjector.register("staticConfig", {
		CLIENT_NAME: "",
		disableAnalytics: false,
		disableCommandHooks: !!opts.disableCommandHooks,
	});
	testInjector.register("extensibilityService", {});
	testInjector.register("optionsTracker", {
		trackOptions: async (): Promise<void> => undefined,
	});
	if (opts.realOptions) {
		testInjector.register("hostInfo", {});
		testInjector.register("settingsService", {
			setSettings: (): any => undefined,
			getProfileDir: () => "profileDir",
		});
		testInjector.register("options", Options);
	} else {
		testInjector.register("options", {
			validateOptions: (): void => undefined,
		});
	}
	testInjector.register("commandsService", CommandsService);
	harness.commandsService = testInjector.resolve("commandsService");
	return harness;
};

const register = (testInjector: IInjector, definition: any): void => {
	runInInjectionContext(testInjector, () =>
		registerCommand(defineCommand(definition)),
	);
};

const deferred = (): { promise: Promise<void>; resolve: () => void } => {
	let resolve: () => void;
	const promise = new Promise<void>((r) => (resolve = r));
	return { promise, resolve };
};

describe("CommandsService in-process dispatch", () => {
	it("leaves no command entry behind when option priming throws", async () => {
		const harness = createHarness();
		const options = harness.injector.resolve("options");
		options.validateOptions = (): void => {
			throw new Error("bad options");
		};
		register(harness.injector, {
			name: "dctest-bad-priming",
			arguments: "none",
			run: (): void => undefined,
		});

		await assert.isRejected(
			harness.commandsService.runCommand("dctest-bad-priming"),
			/bad options/,
		);
		await assert.isRejected(
			harness.commandsService.canExecuteCommand("dctest-bad-priming"),
			/bad options/,
		);

		assert.isUndefined(harness.commandsService.currentCommandData);
	});

	describe("the scope of a definition run as given", () => {
		const ownerScope = (harness: IDispatchHarness, owner: string) =>
			(<any>harness.injector).createChild([
				{ provide: COMMAND_OWNER, useValue: owner },
			]);
		const ownerReader = (seen: string[]) =>
			defineCommand({
				name: "dctest-owner-reader",
				arguments: "none",
				run: () => {
					seen.push(inject(COMMAND_OWNER, { optional: true }) || "cli");
				},
			});

		it("is the caller's injection context, else the root", async () => {
			const harness = createHarness();
			const seen: string[] = [];
			const definition = ownerReader(seen);

			await runInInjectionContext(ownerScope(harness, "ext"), () =>
				harness.commandsService.runCommand(definition),
			);
			await harness.commandsService.runCommand(definition);

			assert.deepEqual(seen, ["ext", "cli"]);
		});

		it("is the injector passed in, ahead of the ambient one", async () => {
			const harness = createHarness();
			const seen: string[] = [];
			const definition = ownerReader(seen);

			await runInInjectionContext(ownerScope(harness, "ambient"), () =>
				harness.commandsService.runCommand(definition, [], {
					injector: ownerScope(harness, "explicit"),
				}),
			);
			assert.isTrue(
				await harness.commandsService.canExecuteCommand(definition, [], {
					injector: ownerScope(harness, "checked"),
				}),
			);

			assert.deepEqual(seen, ["explicit"]);
		});

		it("cannot be given for a registered name", async () => {
			const harness = createHarness();
			register(harness.injector, {
				name: "dctest-registered-scope",
				arguments: "none",
				run: (): void => undefined,
			});

			await assert.isRejected(
				harness.commandsService.runCommand("dctest-registered-scope", [], {
					injector: ownerScope(harness, "ext"),
				}),
				/registered command 'dctest-registered-scope' keeps the scope/,
			);
		});
	});

	describe("a parent name", () => {
		const registerFamily = (
			harness: IDispatchHarness,
			runs: { name: string; args: string[] }[],
		) => {
			register(harness.injector, {
				name: "dctest-family|*main",
				arguments: "any",
				run: (context: any) => {
					runs.push({ name: "main", args: context.args });
				},
			});
			register(harness.injector, {
				name: "dctest-family|child",
				arguments: "any",
				run: (context: any) => {
					runs.push({ name: "child", args: context.args });
				},
			});
		};

		it("runs the default subcommand when no subcommand is named", async () => {
			const harness = createHarness();
			const runs: { name: string; args: string[] }[] = [];
			registerFamily(harness, runs);

			await harness.commandsService.runCommand("dctest-family");

			assert.deepEqual(runs, [{ name: "main", args: [] }]);
			assert.equal(harness.beginCommandCalls, 0);
			assert.equal(harness.consentChecks, 0);
			assert.deepEqual(harness.hooks, [
				"before-dctest-family-main",
				"before-dctest-family",
				"after-dctest-family",
				"after-dctest-family-main",
			]);
		});

		it("runs the named subcommand with the arguments after its name", async () => {
			const harness = createHarness();
			const runs: { name: string; args: string[] }[] = [];
			registerFamily(harness, runs);

			await harness.commandsService.runCommand("dctest-family", ["child", "x"]);

			assert.deepEqual(runs, [{ name: "child", args: ["x"] }]);
			assert.equal(harness.beginCommandCalls, 0);
			assert.equal(harness.consentChecks, 0);
			assert.deepEqual(harness.hooks, [
				"before-dctest-family-child",
				"before-dctest-family",
				"after-dctest-family",
				"after-dctest-family-child",
			]);
		});

		it("fires the hooks the command line fires for the same input", async () => {
			const inProcess = createHarness();
			const commandLine = createHarness();
			registerFamily(inProcess, []);
			registerFamily(commandLine, []);

			await inProcess.commandsService.runCommand("dctest-family", [
				"child",
				"x",
			]);
			await commandLine.commandsService.tryExecuteCommand("dctest-family", [
				"child",
				"x",
			]);

			assert.deepEqual(inProcess.hooks, commandLine.hooks);
		});

		it("rejects with the subcommand's failure instead of exiting", async () => {
			const harness = createHarness();
			register(harness.injector, {
				name: "dctest-broken|*main",
				run: () => {
					throw new Error("dctest leaf failed");
				},
			});

			await assert.isRejected(
				harness.commandsService.runCommand("dctest-broken"),
				/dctest leaf failed/,
			);
			assert.equal(harness.beginCommandCalls, 0);
			assert.equal(harness.consentChecks, 0);
		});

		it("rejects when no subcommand matches and there is no default", async () => {
			const harness = createHarness();
			let ran = false;
			register(harness.injector, {
				name: "dctest-nodefault|child",
				run: () => {
					ran = true;
				},
			});

			await assert.isRejected(
				harness.commandsService.runCommand("dctest-nodefault", ["bogus"]),
				/The input is not valid sub-command for 'dctest-nodefault' command\./,
			);
			assert.isFalse(ran);
			assert.equal(harness.beginCommandCalls, 0);
		});

		it("asks the routed subcommand whether it can execute", async () => {
			const harness = createHarness();
			const consulted: string[][] = [];
			let ran = false;
			register(harness.injector, {
				name: "dctest-asked|*main",
				canExecute: () => false,
				run: () => {
					ran = true;
				},
			});
			register(harness.injector, {
				name: "dctest-asked|child",
				arguments: "any",
				canExecute: (context: any) => {
					consulted.push(context.args);
					return context.args[0] === "ok";
				},
				run: () => {
					ran = true;
				},
			});

			const verdicts = [
				await harness.commandsService.canExecuteCommand("dctest-asked", [
					"child",
					"ok",
				]),
				await harness.commandsService.canExecuteCommand("dctest-asked", [
					"child",
				]),
			];

			assert.deepEqual(verdicts, [true, false]);
			assert.deepEqual(consulted, [["ok"], []]);
			assert.isFalse(ran);
			assert.equal(harness.beginCommandCalls, 0);
		});
	});

	describe("hooks", () => {
		const openIosHooks = [
			"before-dctest-open-ios",
			"before-dctest-open",
			"after-dctest-open",
			"after-dctest-open-ios",
		];

		it("fires the full subcommand name around the parent's for a subcommand name", async () => {
			const harness = createHarness();
			register(harness.injector, {
				name: "dctest-open|ios",
				run: (): void => undefined,
			});

			await harness.commandsService.runCommand("dctest-open|ios");

			assert.deepEqual(harness.hooks, openIosHooks);
		});

		it("fires the same names for a subcommand definition run as given", async () => {
			const harness = createHarness();

			await harness.commandsService.runCommand(
				defineCommand({
					name: "dctest-open|ios",
					run: (): void => undefined,
				}),
			);

			assert.deepEqual(harness.hooks, openIosHooks);
		});

		it("fires one pair for a command without a parent", async () => {
			const harness = createHarness();
			register(harness.injector, {
				name: "dctest-plain",
				arguments: "any",
				run: (): void => undefined,
			});

			await harness.commandsService.runCommand("dctest-plain", ["ios"]);

			assert.deepEqual(harness.hooks, [
				"before-dctest-plain",
				"after-dctest-plain",
			]);
		});

		it("fires none when command hooks are disabled", async () => {
			const harness = createHarness({ disableCommandHooks: true });
			register(harness.injector, {
				name: "dctest-open|ios",
				run: (): void => undefined,
			});

			await harness.commandsService.runCommand("dctest-open|ios");

			assert.deepEqual(harness.hooks, []);
		});

		it("fires none for a subcommand that opts out of hooks", async () => {
			const harness = createHarness();
			register(harness.injector, {
				name: "dctest-open|ios",
				enableHooks: false,
				run: (): void => undefined,
			});

			await harness.commandsService.runCommand("dctest-open|ios");

			assert.deepEqual(harness.hooks, []);
		});
	});
	describe("overlapping dispatches", () => {
		const overlapMessage =
			"Cannot dispatch 'dctest-sibling' in process while 'dctest-holder' is " +
			"still running: in-process dispatches must nest, not overlap; await " +
			"the running one first.";

		// The options service parses process.argv in its constructor.
		const createRealOptionsHarness = (): IDispatchHarness => {
			const originalArgv = process.argv;
			process.argv = [originalArgv[0], originalArgv[1]];
			try {
				return createHarness({ realOptions: true });
			} finally {
				process.argv = originalArgv;
			}
		};

		const registerPair = (harness: IDispatchHarness) => {
			const gate = deferred();
			const runs: string[] = [];
			register(harness.injector, {
				name: "dctest-holder",
				options: { dctestHolderOnly: stringOption({ default: "holder" }) },
				canExecute: () => true,
				run: async () => {
					runs.push("holder-start");
					await gate.promise;
					runs.push("holder-end");
				},
			});
			register(harness.injector, {
				name: "dctest-sibling",
				options: { dctestSiblingOnly: stringOption({ default: "sibling" }) },
				canExecute: () => true,
				run: () => {
					runs.push("sibling");
				},
			});
			return { gate, runs };
		};

		it("runs a dispatch started from inside a running one", async () => {
			const harness = createRealOptionsHarness();
			const runs: string[] = [];
			register(harness.injector, {
				name: "dctest-inner",
				options: { dctestInnerOnly: stringOption({ default: "inner" }) },
				run: (context: any) => {
					runs.push(`inner:${context.options.dctestInnerOnly}`);
				},
			});
			register(harness.injector, {
				name: "dctest-outer",
				run: async () => {
					await Promise.resolve();
					assert.isTrue(
						await harness.commandsService.canExecuteCommand("dctest-inner"),
					);
					await harness.commandsService.runCommand("dctest-inner");
					runs.push("outer");
				},
			});
			const options: any = harness.injector.resolve("options");
			const before = { ...options.options };

			await harness.commandsService.runCommand("dctest-outer");

			assert.deepEqual(runs, ["inner:inner", "outer"]);
			assert.deepEqual(options.options, before);
			assert.isFalse(harness.commandsService.isExecutingInProcess);
		});

		for (const siblingKind of ["runCommand", "canExecuteCommand"] as const) {
			it(`rejects a ${siblingKind} sibling started while another dispatch is in flight`, async () => {
				const harness = createRealOptionsHarness();
				const { gate, runs } = registerPair(harness);
				const options: any = harness.injector.resolve("options");
				const beforeOptions = { ...options.options };
				const beforeArgv = { ...options.argv };

				const holder = harness.commandsService.runCommand("dctest-holder");
				await new Promise((r) => setImmediate(r));
				assert.deepEqual(runs, ["holder-start"]);
				const holderPrimed = { ...options.options };
				assert.property(holderPrimed, "dctestHolderOnly");

				await assert.isRejected(
					harness.commandsService[siblingKind]("dctest-sibling"),
					overlapMessage,
				);
				assert.isTrue(harness.commandsService.isExecutingInProcess);
				assert.equal(
					harness.commandsService.currentCommandData.commandName,
					"dctest-holder",
				);
				assert.deepEqual(options.options, holderPrimed);

				gate.resolve();
				await holder;

				assert.deepEqual(runs, ["holder-start", "holder-end"]);
				assert.isFalse(harness.commandsService.isExecutingInProcess);
				assert.deepEqual(options.options, beforeOptions);
				assert.deepEqual(options.argv, beforeArgv);

				await harness.commandsService[siblingKind]("dctest-sibling");
				assert.deepEqual(options.options, beforeOptions);
				assert.deepEqual(options.argv, beforeArgv);
			});
		}

		it("rejects two dispatches overlapping inside the same running one", async () => {
			const harness = createHarness();
			const { gate } = registerPair(harness);
			let failure: Error;
			register(harness.injector, {
				name: "dctest-fanout",
				run: async () => {
					const holder = harness.commandsService.runCommand("dctest-holder");
					failure = await harness.commandsService
						.runCommand("dctest-sibling")
						.then(
							(): Error => undefined,
							(err: Error) => err,
						);
					gate.resolve();
					await holder;
				},
			});

			await harness.commandsService.runCommand("dctest-fanout");

			assert.equal(failure && failure.message, overlapMessage);
			assert.isFalse(harness.commandsService.isExecutingInProcess);
		});
	});
});
