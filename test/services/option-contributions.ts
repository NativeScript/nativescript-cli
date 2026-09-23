import { assert } from "chai";
import { Yok } from "../../lib/common/yok";
import { IInjector } from "../../lib/common/definitions/yok";
import { inject, InjectionToken } from "../../lib/common/di";
import { CliOptions } from "../../lib/common/contracts/cli-options";
import { OptionContributions } from "../../lib/common/contracts/option-contributions";
import { OptionContributionsRegistry } from "../../lib/common/services/option-contributions";
import {
	booleanOption,
	defineCommand,
	defineOptions,
	numberOption,
	stringOption,
} from "../../lib/common/define-command";
import { createCommandFromDefinition } from "../../lib/common/services/command-definition-adapter";
import { Errors } from "../../lib/common/errors";
import { Options } from "../../lib/options";
import { LoggerStub } from "../stubs";

const createTestInjector = (options: any = {}): IInjector => {
	const testInjector = new Yok();
	testInjector.register("options", options);
	testInjector.register("logger", LoggerStub);
	testInjector.register("errors", {
		failWithHelp: (message: string) => {
			throw new Error(message);
		},
	});
	testInjector.register("optionContributions", OptionContributionsRegistry);
	return testInjector;
};

const contributionsOf = (testInjector: IInjector): OptionContributions =>
	testInjector.get(OptionContributions);

describe("OptionContributionsRegistry", () => {
	describe("registry", () => {
		it("records a command's contributions in order, each group once", () => {
			const contributions = contributionsOf(createTestInjector());
			const First = defineOptions("occtest-order-first", {
				first: booleanOption(),
			});
			const Second = defineOptions("occtest-order-second", {
				second: booleanOption(),
			});

			contributions.contributeToCommand("occtest-run", First);
			contributions.contributeToCommand("occtest-run", Second);
			contributions.contributeToCommand("occtest-run", First);

			assert.sameOrderedMembers(contributions.forCommand("occtest-run"), [
				First,
				Second,
			]);
			assert.deepEqual(contributions.forCommand("occtest-build"), []);
			assert.deepEqual(contributions.forRoot(), []);
		});

		it("hands out copies of its lists", () => {
			const contributions = contributionsOf(createTestInjector());
			const Plugin = defineOptions("occtest-copy-plugin", {
				flavor: stringOption(),
			});
			const Root = defineOptions("occtest-copy-root", {
				copyLevel: stringOption(),
			});
			contributions.contributeToCommand("occtest-run", Plugin);
			contributions.contributeToRoot(Root);

			contributions.forCommand("occtest-run").push(Root);
			contributions.forRoot().push(Plugin);

			assert.sameOrderedMembers(contributions.forCommand("occtest-run"), [
				Plugin,
			]);
			assert.sameOrderedMembers(contributions.forRoot(), [Root]);
		});

		it("rejects what is not an option group, and a missing command name", () => {
			const contributions = contributionsOf(createTestInjector());

			assert.throws(
				() =>
					contributions.contributeToCommand("occtest-run", <any>{
						flavor: stringOption(),
					}),
				/An option contribution is an option group/,
			);
			assert.throws(
				() =>
					contributions.contributeToRoot(
						<any>new InjectionToken("occtest-plain-token"),
					),
				/An option contribution is an option group/,
			);
			assert.throws(
				() =>
					contributions.contributeToCommand(
						"",
						defineOptions("occtest-unnamed-target", {}),
					),
				/names the command it applies to/,
			);
		});
	});

	describe("command contributions", () => {
		it("adds the group's specs to dashedOptions, even after compilation", () => {
			const testInjector = createTestInjector();
			const Plugin = defineOptions("occtest-dashed-plugin", {
				flavor: stringOption({ alias: "f" }),
			});
			const command = createCommandFromDefinition(
				defineCommand({
					name: "occtest-dashed",
					options: { watch: booleanOption() },
					run: (): void => undefined,
				}),
				testInjector,
			);

			contributionsOf(testInjector).contributeToCommand(
				"occtest-dashed",
				Plugin,
			);

			assert.deepEqual(command.dashedOptions, {
				watch: { type: "boolean", hasSensitiveValue: false },
				flavor: { type: "string", hasSensitiveValue: false, alias: "f" },
			});
		});

		it("applies under any of the definition's names", () => {
			const testInjector = createTestInjector();
			const Plugin = defineOptions("occtest-alias-plugin", {
				flavor: stringOption(),
			});
			contributionsOf(testInjector).contributeToCommand(
				"occtest-alias-second",
				Plugin,
			);

			const command = createCommandFromDefinition(
				defineCommand({
					name: ["occtest-alias-first", "occtest-alias-second"],
					run: (): void => undefined,
				}),
				testInjector,
			);

			assert.deepEqual(command.dashedOptions, {
				flavor: { type: "string", hasSensitiveValue: false },
			});
		});

		it("provides the group per invocation and keeps it off ctx.options", async () => {
			const testInjector = createTestInjector({ watch: true, flavor: "free" });
			const Plugin = defineOptions("occtest-provide-plugin", {
				flavor: stringOption(),
			});
			contributionsOf(testInjector).contributeToCommand(
				"occtest-provide",
				Plugin,
			);

			let seenOptions: any;
			let seenGroup: any;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "occtest-provide",
					options: { watch: booleanOption() },
					run: (ctx) => {
						seenOptions = ctx.options;
						seenGroup = inject(Plugin);
					},
				}),
				testInjector,
			);
			await command.execute([]);

			assert.deepEqual(seenOptions, { watch: true });
			assert.deepEqual(seenGroup, { flavor: "free" });
			assert.isNull(testInjector.get(Plugin, { optional: true }));
		});

		it("reaches a command that declares no options of its own", async () => {
			const testInjector = createTestInjector({ flavor: "paid" });
			const Plugin = defineOptions("occtest-bare-plugin", {
				flavor: stringOption(),
			});

			let seenOptions: any;
			let seenGroup: any;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "occtest-bare",
					run: (ctx) => {
						seenOptions = ctx.options;
						seenGroup = ctx.injector.get(Plugin);
					},
				}),
				testInjector,
			);
			contributionsOf(testInjector).contributeToCommand("occtest-bare", Plugin);
			await command.execute([]);

			assert.deepEqual(seenOptions, {});
			assert.deepEqual(seenGroup, { flavor: "paid" });
		});

		it("reports a contribution that redeclares the command's own option differently", async () => {
			const testInjector = createTestInjector();
			const Plugin = defineOptions("occtest-clash-plugin", {
				flavor: stringOption({ alias: "f" }),
			});
			const command = createCommandFromDefinition(
				defineCommand({
					name: "occtest-clash",
					options: { flavor: stringOption() },
					run: (): void => undefined,
				}),
				testInjector,
			);
			contributionsOf(testInjector).contributeToCommand(
				"occtest-clash",
				Plugin,
			);

			const expected =
				"Command 'occtest-clash': option '--flavor' is declared by the command's own options and by option group 'occtest-clash-plugin' with different specs";
			assert.throws(() => command.dashedOptions, expected);
			await assert.isRejected(command.execute([]), expected);
		});

		it("refuses a contributed group that redeclares a process-level option", () => {
			const testInjector = createTestInjector();
			const Plugin = defineOptions("occtest-rootclash-plugin", {
				config: stringOption(),
			});
			const command = createCommandFromDefinition(
				defineCommand({
					name: "occtest-rootclash",
					run: (): void => undefined,
				}),
				testInjector,
			);
			contributionsOf(testInjector).contributeToCommand(
				"occtest-rootclash",
				Plugin,
			);

			assert.throws(
				() => command.dashedOptions,
				"Command 'occtest-rootclash': '--config' is a process-level option",
			);
		});
	});

	describe("root contributions", () => {
		it("provides the group on the injector, read off the options service", () => {
			const testInjector = createTestInjector({ telemetryLevel: "full" });
			const Root = defineOptions("occtest-root-provide", {
				telemetryLevel: stringOption(),
			});

			contributionsOf(testInjector).contributeToRoot(Root);

			assert.deepEqual(testInjector.get(Root), { telemetryLevel: "full" });
			assert.deepEqual(testInjector.resolve("options:occtest-root-provide"), {
				telemetryLevel: "full",
			});
			assert.sameOrderedMembers(contributionsOf(testInjector).forRoot(), [
				Root,
			]);
		});

		it("rejects a group that collides with CliOptions or another root group", () => {
			const contributions = contributionsOf(createTestInjector());
			const Verbose = defineOptions("occtest-root-verbose", {
				verbose: stringOption(),
			});
			const Vendor = defineOptions("occtest-root-vendor", {
				vendor: stringOption({ alias: "v" }),
			});
			const Level = defineOptions("occtest-root-level", {
				level: stringOption(),
			});
			const LevelAgain = defineOptions("occtest-root-level-again", {
				level: numberOption(),
			});

			assert.throws(
				() => contributions.contributeToRoot(Verbose),
				"Option group 'occtest-root-verbose': '--verbose' is already a process-level option",
			);
			assert.throws(
				() => contributions.contributeToRoot(Vendor),
				"Option group 'occtest-root-vendor': '-v' is already a process-level option",
			);
			contributions.contributeToRoot(Level);
			assert.throws(
				() => contributions.contributeToRoot(LevelAgain),
				"Option group 'occtest-root-level-again': '--level' is already a process-level option",
			);

			assert.sameOrderedMembers(contributions.forRoot(), [Level]);
		});

		it("rejects a group that repeats a CliOptions spec exactly", () => {
			const testInjector = createTestInjector();
			const contributions = contributionsOf(testInjector);
			const Verbose = defineOptions("occtest-root-verbose-copy", {
				verbose: booleanOption(),
			});

			assert.throws(
				() => contributions.contributeToRoot(Verbose),
				"Option group 'occtest-root-verbose-copy': '--verbose' is already a process-level option",
			);
			assert.deepEqual(contributions.forRoot(), []);
			assert.isNull(testInjector.get(Verbose, { optional: true }));
		});

		it("makes the group's spellings process-level for every command", async () => {
			const testInjector = createTestInjector({ telemetryLevel: "full" });
			const Root = defineOptions("occtest-root-guard", {
				telemetryLevel: stringOption(),
			});
			contributionsOf(testInjector).contributeToRoot(Root);

			assert.throws(
				() =>
					createCommandFromDefinition(
						defineCommand({
							name: "occtest-root-redeclare",
							options: { telemetryLevel: stringOption() },
							run: (): void => undefined,
						}),
						testInjector,
					),
				"Command 'occtest-root-redeclare': '--telemetryLevel' is a process-level option",
			);

			let seen: any;
			const command = createCommandFromDefinition(
				defineCommand({
					name: "occtest-root-listed",
					options: [Root],
					run: (ctx) => {
						seen = ctx.options;
					},
				}),
				testInjector,
			);
			await command.execute([]);

			assert.deepEqual(seen, { telemetryLevel: "full" });
		});
	});

	describe("Options.globalOptions", () => {
		let failures: string[];
		let originalArgv: string[];

		const createOptionsInjector = (): IInjector => {
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
			testInjector.register("optionContributions", OptionContributionsRegistry);
			testInjector.register("options", Options);
			return testInjector;
		};

		beforeEach(() => {
			failures = [];
			originalArgv = process.argv;
			process.env.NS_STRICT_OPTIONS = "error";
		});

		afterEach(() => {
			process.argv = originalArgv;
			delete process.env.NS_STRICT_OPTIONS;
		});

		it("parses a root group contributed before the options service is built", () => {
			const testInjector = createOptionsInjector();
			const Root = defineOptions("occtest-global-before", {
				occBefore: stringOption({ alias: "B" }),
			});
			contributionsOf(testInjector).contributeToRoot(Root);
			process.argv = [originalArgv[0], originalArgv[1], "--occ-before", "x"];

			const options: any = testInjector.resolve("options");
			options.validateOptions();

			assert.deepEqual(failures, []);
			assert.deepEqual(options.globalOptions.occBefore, {
				type: "string",
				hasSensitiveValue: false,
				alias: "B",
			});
			assert.deepEqual(options.globalOptions.path, {
				type: "string",
				hasSensitiveValue: true,
				alias: "p",
			});
			assert.deepEqual(testInjector.get(Root), { occBefore: "x" });
		});

		it("takes in a root group contributed after the options service is built", () => {
			const testInjector = createOptionsInjector();
			const Root = defineOptions("occtest-global-after", {
				occAfter: booleanOption(),
			});
			process.argv = [originalArgv[0], originalArgv[1], "--occ-after"];

			const options: any = testInjector.resolve("options");
			assert.notProperty(options.globalOptions, "occAfter");
			contributionsOf(testInjector).contributeToRoot(Root);
			options.validateOptions();

			assert.deepEqual(failures, []);
			assert.property(options.globalOptions, "occAfter");
			assert.deepEqual(testInjector.get(Root), { occAfter: true });
		});

		it("still rejects the flag when no root group declares it", () => {
			const testInjector = createOptionsInjector();
			process.argv = [originalArgv[0], originalArgv[1], "--occnobody", "x"];

			const options: any = testInjector.resolve("options");
			options.validateOptions();

			assert.lengthOf(failures, 1);
			assert.match(failures[0], /'occnobody' is not supported/);
			assert.includeMembers(
				Object.keys(options.globalOptions),
				Object.keys(CliOptions.schema),
			);
		});
	});
});
