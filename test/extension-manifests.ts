import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ExtensibilityService } from "../lib/services/extensibility-service";
import { Yok, getInjector, setGlobalInjector } from "../lib/common/yok";
import { LoggerStub } from "./stubs";
import { clearReportedDeprecations } from "../lib/common/deprecation";
import { CommandsDelimiters } from "../lib/common/constants";
import { IInjector } from "../lib/common/definitions/yok";
import {
	IExtensibilityService,
	IExtensionData,
} from "../lib/common/definitions/extensibility";
import { IStringDictionary } from "../lib/common/declarations";

// Every assertion about registered commands goes through the per-test
// injector: the service takes $injector as a constructor dependency. The
// process-wide injector is pointed at that same instance for each test's
// duration ONLY because legacy-shape fixture modules register through the
// published global surface when they load - that swap is the legacy-compat
// seam, not the assertion path. Command names stay unique per test since the
// module require cache outlives a test.

interface ITestCapture {
	loadedModules: string[];
	executed: any[];
}

const DEPRECATION_API = "extensions.require-time-registration";

describe("extension manifests", () => {
	let profileDir: string;
	let requiredPaths: string[];
	let capture: ITestCapture;
	let testInjector: IInjector;
	let previousProcessInjector: IInjector;

	beforeEach(() => {
		profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-ext-manifest-"));
		testInjector = getTestInjector();
		previousProcessInjector = getInjector();
		setGlobalInjector(testInjector);
		requiredPaths = [];
		capture = (<any>global).__nsmCapture = {
			loadedModules: [],
			executed: [],
		};
		fs.mkdirSync(path.join(profileDir, "extensions", "node_modules"), {
			recursive: true,
		});
		writeExtensionsPackageJson({});
		clearReportedDeprecations();
	});

	afterEach(() => {
		setGlobalInjector(previousProcessInjector);
		fs.rmSync(profileDir, { recursive: true, force: true });
		delete (<any>global).__nsmCapture;
	});

	const writeExtensionsPackageJson = (
		dependencies: IStringDictionary,
	): void => {
		fs.writeFileSync(
			path.join(profileDir, "extensions", "package.json"),
			JSON.stringify({
				name: "nativescript-extensibility",
				version: "1.0.0",
				dependencies,
			}),
		);
	};

	/**
	 * Lays out a real extension package: package.json with the given nativescript
	 * key plus the given files, and an entry in the extensions dir dependencies.
	 */
	const writeExtension = (
		extensionName: string,
		nativescript: any,
		files: IStringDictionary,
	): string => {
		const pathToExtension = path.join(
			profileDir,
			"extensions",
			"node_modules",
			extensionName,
		);
		fs.mkdirSync(pathToExtension, { recursive: true });
		fs.writeFileSync(
			path.join(pathToExtension, "package.json"),
			JSON.stringify({
				name: extensionName,
				version: "1.0.0",
				main: "main.js",
				nativescript,
			}),
		);

		for (const relativePath of Object.keys(files || {})) {
			const pathToFile = path.join(pathToExtension, relativePath);
			fs.mkdirSync(path.dirname(pathToFile), { recursive: true });
			fs.writeFileSync(pathToFile, files[relativePath]);
		}

		const pathToExtensionsPackageJson = path.join(
			profileDir,
			"extensions",
			"package.json",
		);
		const packageJsonData = JSON.parse(
			fs.readFileSync(pathToExtensionsPackageJson).toString(),
		);
		packageJsonData.dependencies[extensionName] = "1.0.0";
		fs.writeFileSync(
			pathToExtensionsPackageJson,
			JSON.stringify(packageJsonData),
		);

		return pathToExtension;
	};

	const mainModule = (marker: string): string =>
		`global.__nsmCapture.loadedModules.push(${JSON.stringify(marker)});`;

	const commandModule = (commandName: string, marker: string): string =>
		`class TestCommand {
			constructor() {
				this.allowedParameters = [];
			}
			async execute(args) {
				global.__nsmCapture.executed.push({ marker: ${JSON.stringify(
					marker,
				)}, args: args });
			}
		}
		global.__nsmCapture.loadedModules.push(${JSON.stringify(marker)});
		global.$injector.registerCommand(${JSON.stringify(commandName)}, TestCommand);`;

	const getTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("fs", {
			exists: (pathToCheck: string): boolean => fs.existsSync(pathToCheck),
			readJson: (pathToFile: string): any =>
				JSON.parse(fs.readFileSync(pathToFile).toString()),
			readText: (pathToFile: string): string =>
				fs.readFileSync(pathToFile).toString(),
			readDirectory: (dir: string): string[] => fs.readdirSync(dir),
			createDirectory: (dir: string): void => {
				fs.mkdirSync(dir, { recursive: true });
			},
			writeJson: (pathToFile: string, content: any): void =>
				fs.writeFileSync(pathToFile, JSON.stringify(content)),
		});
		testInjector.register("logger", LoggerStub);
		testInjector.register("packageManager", {
			install: async (): Promise<any> => {
				throw new Error("Extensions are expected to be installed already.");
			},
			uninstall: async (): Promise<any> => undefined,
			searchNpms: async (): Promise<any> => ({ results: [] }),
			getRegistryPackageData: async (): Promise<any> => ({}),
		});
		testInjector.register("settingsService", {
			getProfileDir: (): string => profileDir,
		});
		testInjector.register("requireService", {
			require: (module: string): any => {
				requiredPaths.push(module);
				return require(module);
			},
		});

		return testInjector;
	};

	const resolveService = (testInjector: IInjector): IExtensibilityService =>
		testInjector.resolve<IExtensibilityService>(ExtensibilityService);

	const getLogger = (testInjector: IInjector): LoggerStub =>
		testInjector.resolve<LoggerStub>("logger");

	describe("commands declared as a map", () => {
		it("registers each command lazily and never loads the extension main", async () => {
			const extensionName = "nsm-lazy-ext";
			writeExtension(
				extensionName,
				{
					commands: {
						"nsmlazy|run": "./dist/commands/run.js",
						"nsmlazy|clean": "./dist/commands/clean.js",
					},
				},
				{
					"main.js": mainModule("lazy-main"),
					"dist/commands/run.js": commandModule("nsmlazy|run", "lazy-run"),
					"dist/commands/clean.js": commandModule(
						"nsmlazy|clean",
						"lazy-clean",
					),
				},
			);

			const extensibilityService = resolveService(testInjector);
			const extensionData =
				await extensibilityService.loadExtension(extensionName);

			assert.deepStrictEqual(capture.loadedModules, []);
			assert.deepStrictEqual(
				requiredPaths,
				[],
				"The extension main must not be required when its commands are declared as a map.",
			);
			assert.notInclude(getLogger(testInjector).traceOutput, DEPRECATION_API);
			assert.deepStrictEqual(extensionData.commands, [
				"nsmlazy|run",
				"nsmlazy|clean",
			]);

			const command = testInjector.resolveCommand("nsmlazy|run");
			assert.isOk(command);
			assert.deepStrictEqual(capture.loadedModules, ["lazy-run"]);

			await command.execute(["arg"]);
			assert.deepStrictEqual(capture.executed, [
				{ marker: "lazy-run", args: ["arg"] },
			]);

			// The other command's module is still not loaded, and neither is main.
			assert.deepStrictEqual(capture.loadedModules, ["lazy-run"]);
			assert.deepStrictEqual(requiredPaths, []);
		});

		it("warns about and skips malformed entries, keeping the valid ones", async () => {
			const extensionName = "nsm-malformed-ext";
			writeExtension(
				extensionName,
				{
					commands: {
						"nsmbad|good": "./good.js",
						"nsmbad|number": <any>42,
						"nsmbad|empty": "   ",
						"": "./unnamed.js",
					},
				},
				{
					"main.js": mainModule("malformed-main"),
					"good.js": commandModule("nsmbad|good", "malformed-good"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			const warnOutput = getLogger(testInjector).warnOutput;
			assert.include(warnOutput, "nsmbad|number");
			assert.include(warnOutput, "nsmbad|empty");
			assert.include(warnOutput, extensionName);

			assert.isOk(testInjector.resolveCommand("nsmbad|good"));
			assert.isNull(testInjector.resolveCommand("nsmbad|number"));
			assert.isNull(testInjector.resolveCommand("nsmbad|empty"));
			assert.deepStrictEqual(capture.loadedModules, ["malformed-good"]);
		});

		it("warns instead of failing when two extensions claim the same command", async () => {
			const firstExtension = "nsm-first-ext";
			const secondExtension = "nsm-second-ext";
			writeExtension(
				firstExtension,
				{ commands: { "nsmconflict|run": "./run.js" } },
				{
					"main.js": mainModule("first-main"),
					"run.js": commandModule("nsmconflict|run", "first-run"),
				},
			);
			writeExtension(
				secondExtension,
				{ commands: { "nsmconflict|run": "./run.js" } },
				{
					"main.js": mainModule("second-main"),
					"run.js": commandModule("nsmconflict|run", "second-run"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(firstExtension);
			await extensibilityService.loadExtension(secondExtension);

			const warnOutput = getLogger(testInjector).warnOutput;
			assert.include(warnOutput, "nsmconflict|run");
			assert.include(warnOutput, firstExtension);
			assert.include(warnOutput, secondExtension);

			const command = testInjector.resolveCommand("nsmconflict|run");
			await command.execute([]);
			assert.deepStrictEqual(capture.executed, [
				{ marker: "first-run", args: [] },
			]);
		});
	});

	describe("commands declared as an array", () => {
		it("requires the extension main eagerly and reports the deprecated registration", async () => {
			const extensionName = "nsm-eager-ext";
			const pathToExtension = writeExtension(
				extensionName,
				{ commands: ["nsmeager|run"] },
				{
					"main.js": `${mainModule("eager-main")}
					${commandModule("nsmeager|run", "eager-run")}`,
				},
			);

			const extensibilityService = resolveService(testInjector);
			const extensionData =
				await extensibilityService.loadExtension(extensionName);

			assert.deepStrictEqual(requiredPaths, [pathToExtension]);
			assert.deepStrictEqual(capture.loadedModules, [
				"eager-main",
				"eager-run",
			]);

			const traceOutput = getLogger(testInjector).traceOutput;
			assert.include(traceOutput, DEPRECATION_API);
			assert.include(traceOutput, extensionName);

			assert.deepStrictEqual(extensionData.commands, ["nsmeager|run"]);
			assert.isOk(testInjector.resolveCommand("nsmeager|run"));
		});

		it("keeps the eager path when the extension declares no commands", async () => {
			const extensionName = "nsm-no-commands-ext";
			const pathToExtension = writeExtension(
				extensionName,
				{ docs: "./docs" },
				{ "main.js": mainModule("no-commands-main") },
			);

			const extensibilityService = resolveService(testInjector);
			const extensionData =
				await extensibilityService.loadExtension(extensionName);

			assert.deepStrictEqual(requiredPaths, [pathToExtension]);
			assert.include(getLogger(testInjector).traceOutput, DEPRECATION_API);
			assert.isUndefined(extensionData.commands);
		});
	});

	describe("getInstalledExtensionsData", () => {
		it("reports the declared command names for both manifest shapes", () => {
			writeExtension(
				"nsm-data-map-ext",
				{ commands: { "nsmdata|one": "./one.js", "nsmdata|two": "./two.js" } },
				{},
			);
			writeExtension("nsm-data-array-ext", { commands: ["nsmdata|three"] }, {});
			writeExtension("nsm-data-plain-ext", {}, {});

			const extensibilityService = resolveService(testInjector);
			const extensionsData = extensibilityService.getInstalledExtensionsData();
			const dataByName: { [name: string]: IExtensionData } = {};
			for (const extensionData of extensionsData) {
				dataByName[extensionData.extensionName] = extensionData;
			}

			assert.deepStrictEqual(dataByName["nsm-data-map-ext"].commands, [
				"nsmdata|one",
				"nsmdata|two",
			]);
			assert.deepStrictEqual(dataByName["nsm-data-array-ext"].commands, [
				"nsmdata|three",
			]);
			assert.isUndefined(dataByName["nsm-data-plain-ext"].commands);
		});
	});

	describe("getExtensionNameWhereCommandIsRegistered", () => {
		const getExtensionCommandInfo = async (
			registryCommands: any,
			inputStrings: string[],
		): Promise<any> => {
			const extensionName = "nsm-registry-ext";
			const packageManager = testInjector.resolve<any>("packageManager");
			packageManager.searchNpms = async (keyword: string): Promise<any> => {
				assert.equal(keyword, "nativescript:extension");
				return { results: [{ package: { name: extensionName } }] };
			};
			packageManager.getRegistryPackageData = async (): Promise<any> => ({
				["dist-tags"]: { latest: "1.0.0" },
				versions: {
					"1.0.0": { nativescript: { commands: registryCommands } },
				},
			});

			const extensibilityService = resolveService(testInjector);
			return extensibilityService.getExtensionNameWhereCommandIsRegistered({
				inputStrings,
				commandDelimiter: CommandsDelimiters.HierarchicalCommand,
				defaultCommandDelimiter: CommandsDelimiters.DefaultHierarchicalCommand,
			});
		};

		it("suggests an extension whose registry data declares commands as a map", async () => {
			const result = await getExtensionCommandInfo(
				{ "registry|command": "./registry-command.js" },
				["registry", "command", "and", "args"],
			);

			assert.deepStrictEqual(result, {
				extensionName: "nsm-registry-ext",
				registeredCommandName: "registry|command",
				installationMessage:
					"The command registry command is registered in extension nsm-registry-ext. You can install it by executing 'ns extension install nsm-registry-ext'",
			});
		});

		it("synthesizes the short form of a default command declared as a map", async () => {
			const result = await getExtensionCommandInfo(
				{
					"registry|*default": "./registry-default.js",
					"registry|other": "./registry-other.js",
				},
				["registry", "and", "args"],
			);

			assert.deepStrictEqual(result, {
				extensionName: "nsm-registry-ext",
				registeredCommandName: "registry",
				installationMessage:
					"The command registry is registered in extension nsm-registry-ext. You can install it by executing 'ns extension install nsm-registry-ext'",
			});
		});

		it("still suggests an extension whose registry data declares commands as an array", async () => {
			const result = await getExtensionCommandInfo(
				["registry|*default", "registry|other"],
				["registry", "and", "args"],
			);

			assert.deepStrictEqual(result, {
				extensionName: "nsm-registry-ext",
				registeredCommandName: "registry",
				installationMessage:
					"The command registry is registered in extension nsm-registry-ext. You can install it by executing 'ns extension install nsm-registry-ext'",
			});
		});

		it("returns null when the declared commands do not match the input", async () => {
			const result = await getExtensionCommandInfo(
				{ "registry|command": "./registry-command.js" },
				["some", "other", "command"],
			);

			assert.isNull(result);
		});
	});

	describe("commands declared as defineCommand modules", () => {
		const contractsPath = require.resolve("../lib/contracts");

		const definitionModule = (
			commandName: string,
			marker: string,
			exportAs: string = "module.exports",
		): string =>
			`const { defineCommand } = require(${JSON.stringify(contractsPath)});
			global.__nsmCapture.loadedModules.push(${JSON.stringify(marker)});
			${exportAs} = defineCommand({
				name: ${JSON.stringify(commandName)},
				arguments: "any",
				async run(ctx) {
					global.__nsmCapture.executed.push({ marker: ${JSON.stringify(
						marker,
					)}, args: ctx.args });
				},
			});`;

		it("adapts and registers a pure definition module lazily", async () => {
			const extensionName = "nsm-def-ext";
			writeExtension(
				extensionName,
				{ commands: { "nsmdef|hello": "./dist/hello.js" } },
				{
					"main.js": mainModule("def-main"),
					"dist/hello.js": definitionModule("nsmdef|hello", "def-hello"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			assert.deepEqual(capture.loadedModules, []);

			const command = testInjector.resolveCommand("nsmdef|hello");
			assert.isOk(command);
			assert.deepEqual(capture.loadedModules, ["def-hello"]);

			await command.execute(["fast"]);
			assert.deepEqual(capture.executed, [
				{ marker: "def-hello", args: ["fast"] },
			]);
		});

		it("resolves the hierarchical parent dispatcher without loading any child module", async () => {
			const extensionName = "nsm-defp-ext";
			writeExtension(
				extensionName,
				{
					commands: {
						"nsmdefp|go": "./dist/go.js",
						"nsmdefp|stop": "./dist/stop.js",
					},
				},
				{
					"main.js": mainModule("defp-main"),
					"dist/go.js": definitionModule("nsmdefp|go", "defp-go"),
					"dist/stop.js": definitionModule("nsmdefp|stop", "defp-stop"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			const parent = <any>testInjector.resolveCommand("nsmdefp");
			assert.isOk(parent);
			assert.isTrue(parent.isHierarchicalCommand);
			assert.deepEqual(capture.loadedModules, []);
			assert.deepEqual(testInjector.getChildrenCommandsNames("nsmdefp"), [
				"go",
				"stop",
			]);

			assert.isOk(testInjector.resolveCommand("nsmdefp|go"));
			assert.deepEqual(capture.loadedModules, ["defp-go"]);
		});

		it("registers a definition under the manifest key and warns about a disagreeing name", async () => {
			const extensionName = "nsm-defname-ext";
			writeExtension(
				extensionName,
				{ commands: { "nsmdefname|run": "./dist/run.js" } },
				{
					"main.js": mainModule("defname-main"),
					"dist/run.js": definitionModule("something|else", "defname-run"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			const command = testInjector.resolveCommand("nsmdefname|run");
			assert.isOk(command);
			await command.execute([]);
			assert.deepEqual(capture.executed, [{ marker: "defname-run", args: [] }]);
			assert.isNull(testInjector.resolveCommand("something|else"));

			const warnOutput = getLogger(testInjector).warnOutput;
			assert.include(warnOutput, "nsmdefname|run");
			assert.include(warnOutput, "something|else");
			assert.include(warnOutput, extensionName);
		});

		it("adapts a definition exported as the module's default", async () => {
			const extensionName = "nsm-defdefault-ext";
			writeExtension(
				extensionName,
				{ commands: { "nsmdefdefault|hello": "./dist/hello.js" } },
				{
					"main.js": mainModule("defdefault-main"),
					"dist/hello.js": definitionModule(
						"nsmdefdefault|hello",
						"defdefault-hello",
						"exports.default",
					),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			const command = testInjector.resolveCommand("nsmdefdefault|hello");
			assert.isOk(command);
			await command.execute([]);
			assert.deepEqual(capture.executed, [
				{ marker: "defdefault-hello", args: [] },
			]);
		});

		it("routes two aliases of one command to the same module", async () => {
			const extensionName = "nsm-alias-ext";
			writeExtension(
				extensionName,
				{
					commands: {
						"nsmalias|run": "./dist/run.js",
						"nsmalias|r": "./dist/run.js",
					},
				},
				{
					"main.js": mainModule("alias-main"),
					"dist/run.js": definitionModule("nsmalias|run", "alias-run"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			assert.isOk(testInjector.resolveCommand("nsmalias|run"));
			const aliased = testInjector.resolveCommand("nsmalias|r");
			assert.isOk(aliased);

			await aliased.execute(["x"]);
			assert.deepEqual(capture.executed, [
				{ marker: "alias-run", args: ["x"] },
			]);
		});
	});

	describe("manifest entry values", () => {
		it("accepts an object entry carrying the module path and ignores its other keys", async () => {
			const extensionName = "nsm-envelope-ext";
			writeExtension(
				extensionName,
				{
					commands: {
						"nsmenvelope|run": <any>{
							path: "./run.js",
							somethingAddedLater: true,
						},
					},
				},
				{
					"main.js": mainModule("envelope-main"),
					"run.js": commandModule("nsmenvelope|run", "envelope-run"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			assert.deepEqual(capture.loadedModules, []);
			assert.isOk(testInjector.resolveCommand("nsmenvelope|run"));
			assert.deepEqual(capture.loadedModules, ["envelope-run"]);
		});

		it("warns about and skips an object entry without a usable path", async () => {
			const extensionName = "nsm-envelope-bad-ext";
			writeExtension(
				extensionName,
				{ commands: { "nsmenvelopebad|run": <any>{ module: "./run.js" } } },
				{ "main.js": mainModule("envelope-bad-main") },
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			assert.include(getLogger(testInjector).warnOutput, "nsmenvelopebad|run");
			assert.isNull(testInjector.resolveCommand("nsmenvelopebad|run"));
		});
	});

	describe("manifest keys the CLI cannot route", () => {
		it("rejects a key that is not lower case", async () => {
			const extensionName = "nsm-case-ext";
			writeExtension(
				extensionName,
				{ commands: { "nsmCase|Run": "./run.js" } },
				{
					"main.js": mainModule("case-main"),
					"run.js": commandModule("nsmcase|run", "case-run"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			const warnOutput = getLogger(testInjector).warnOutput;
			assert.include(warnOutput, "nsmCase|Run");
			assert.include(warnOutput, "nsmcase|run");
			assert.include(warnOutput, extensionName);
			assert.isNull(testInjector.resolveCommand("nsmCase|Run"));
			assert.isNull(testInjector.resolveCommand("nsmcase|run"));
		});

		it("rejects a key already in use as the parent of its own subcommands", async () => {
			const extensionName = "nsm-parentclash-ext";
			writeExtension(
				extensionName,
				{
					commands: {
						"nsmparentclash|run": "./run.js",
						nsmparentclash: "./flat.js",
					},
				},
				{
					"main.js": mainModule("parentclash-main"),
					"run.js": commandModule("nsmparentclash|run", "parentclash-run"),
					"flat.js": commandModule("nsmparentclash", "parentclash-flat"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			const warnOutput = getLogger(testInjector).warnOutput;
			assert.include(warnOutput, "nsmparentclash");
			assert.include(warnOutput, "parent of its subcommands");

			const parent = <any>testInjector.resolveCommand("nsmparentclash");
			assert.isTrue(parent.isHierarchicalCommand);
			assert.deepEqual(capture.loadedModules, []);
		});

		it("rejects a subcommand whose parent is a command of its own", async () => {
			const extensionName = "nsm-parentcmd-ext";
			writeExtension(
				extensionName,
				{
					commands: {
						nsmparentcmd: "./flat.js",
						"nsmparentcmd|run": "./run.js",
					},
				},
				{
					"main.js": mainModule("parentcmd-main"),
					"flat.js": commandModule("nsmparentcmd", "parentcmd-flat"),
					"run.js": commandModule("nsmparentcmd|run", "parentcmd-run"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			const warnOutput = getLogger(testInjector).warnOutput;
			assert.include(warnOutput, extensionName);
			assert.include(warnOutput, "nsmparentcmd|run");
			assert.include(warnOutput, "already registered as a command of its own");
			assert.notInclude(warnOutput, "no subcommand dispatcher was created");

			assert.isNull(testInjector.resolveCommand("nsmparentcmd|run"));
			assert.isUndefined(
				testInjector.getChildrenCommandsNames("nsmparentcmd"),
				"The rejected subcommand must not be recorded under its parent.",
			);

			const command = <any>testInjector.resolveCommand("nsmparentcmd");
			assert.isNotOk(command.isHierarchicalCommand);
			await command.execute([]);
			assert.deepEqual(capture.executed, [
				{ marker: "parentcmd-flat", args: [] },
			]);

			// Ownership of a rejected name is not recorded, so the same extension
			// is told again rather than treated as the owner on the next load.
			await extensibilityService.loadExtension(extensionName);
			assert.equal(
				getLogger(testInjector).warnOutput.split("nsmparentcmd|run").length - 1,
				2,
			);
		});

		it("reports a command the CLI itself provides without naming internals", async () => {
			const extensionName = "nsm-builtin-ext";
			class BuiltInCommand {
				public allowedParameters: any[] = [];
				public async execute(): Promise<void> {
					return undefined;
				}
			}
			testInjector.registerCommand("nsmbuiltin", BuiltInCommand);

			writeExtension(
				extensionName,
				{ commands: { nsmbuiltin: "./run.js" } },
				{
					"main.js": mainModule("builtin-main"),
					"run.js": commandModule("nsmbuiltin", "builtin-run"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			const warnOutput = getLogger(testInjector).warnOutput;
			assert.include(warnOutput, "already provided by the CLI");
			assert.include(warnOutput, extensionName);
			assert.notInclude(warnOutput, "commands.");

			assert.instanceOf(
				testInjector.resolveCommand("nsmbuiltin"),
				BuiltInCommand,
			);
			assert.deepEqual(capture.loadedModules, []);
		});
	});

	describe("manifest keys that name an Object prototype member", () => {
		it("registers a flat command named after a prototype member", async () => {
			const extensionName = "nsm-proto-flat-ext";
			writeExtension(
				extensionName,
				{ commands: { constructor: "./run.js" } },
				{
					"main.js": mainModule("proto-flat-main"),
					"run.js": commandModule("constructor", "proto-flat-run"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			assert.equal(getLogger(testInjector).warnOutput, "");

			const command = testInjector.resolveCommand("constructor");
			assert.isOk(command);
			await command.execute([]);
			assert.deepEqual(capture.executed, [
				{ marker: "proto-flat-run", args: [] },
			]);
		});

		it("routes a subcommand whose parent names a prototype member", async () => {
			const extensionName = "nsm-proto-parent-ext";
			writeExtension(
				extensionName,
				{ commands: { "constructor|run": "./run.js" } },
				{
					"main.js": mainModule("proto-parent-main"),
					"run.js": commandModule("constructor|run", "proto-parent-run"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			assert.equal(getLogger(testInjector).warnOutput, "");
			assert.deepEqual(testInjector.getChildrenCommandsNames("constructor"), [
				"run",
			]);

			const parent = <any>testInjector.resolveCommand("constructor");
			assert.isTrue(parent.isHierarchicalCommand);
			assert.deepEqual(capture.loadedModules, []);

			const command = testInjector.resolveCommand("constructor|run");
			assert.isOk(command);
			await command.execute([]);
			assert.deepEqual(capture.executed, [
				{ marker: "proto-parent-run", args: [] },
			]);
		});
	});

	describe("loading an already loaded extension", () => {
		it("does not report the extension as conflicting with itself", async () => {
			const extensionName = "nsm-reload-ext";
			writeExtension(
				extensionName,
				{ commands: { "nsmreload|run": "./run.js" } },
				{
					"main.js": mainModule("reload-main"),
					"run.js": commandModule("nsmreload|run", "reload-run"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);
			await extensibilityService.loadExtension(extensionName);

			assert.equal(getLogger(testInjector).warnOutput, "");
			assert.isOk(testInjector.resolveCommand("nsmreload|run"));
		});
	});

	describe("a manifest declaring no commands to load", () => {
		it("loads nothing at all for an empty commands map", async () => {
			const extensionName = "nsm-optout-ext";
			writeExtension(
				extensionName,
				{ commands: {} },
				{ "main.js": mainModule("optout-main") },
			);

			const extensibilityService = resolveService(testInjector);
			const extensionData =
				await extensibilityService.loadExtension(extensionName);

			assert.deepStrictEqual(requiredPaths, []);
			assert.deepStrictEqual(capture.loadedModules, []);
			assert.notInclude(getLogger(testInjector).traceOutput, DEPRECATION_API);
			assert.deepStrictEqual(extensionData.commands, []);
		});
	});

	describe("a module that fails to provide its command", () => {
		it("names the extension and the module when the module throws", async () => {
			const extensionName = "nsm-throwing-ext";
			writeExtension(
				extensionName,
				{ commands: { "nsmthrowing|run": "./run.js" } },
				{
					"main.js": mainModule("throwing-main"),
					"run.js": `throw new Error("kaboom");`,
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			assert.throws(
				() => testInjector.resolveCommand("nsmthrowing|run"),
				/nsmthrowing\|run[\s\S]*nsm-throwing-ext[\s\S]*run\.js[\s\S]*kaboom/,
			);
		});

		it("names the extension and the module when the module registers nothing", async () => {
			const extensionName = "nsm-silent-ext";
			writeExtension(
				extensionName,
				{ commands: { "nsmsilent|run": "./run.js" } },
				{
					"main.js": mainModule("silent-main"),
					"run.js": `module.exports = { notADefinition: true };`,
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			assert.throws(
				() => testInjector.resolveCommand("nsmsilent|run"),
				/nsmsilent\|run[\s\S]*nsm-silent-ext[\s\S]*run\.js/,
			);
		});
	});

	describe("default commands", () => {
		it("registers the default before its siblings whatever the key order", async () => {
			const extensionName = "nsm-defaults-ext";
			writeExtension(
				extensionName,
				{
					commands: {
						"nsmdefaults|other": "./other.js",
						"nsmdefaults|*default": "./default.js",
					},
				},
				{
					"main.js": mainModule("defaults-main"),
					"other.js": commandModule("nsmdefaults|other", "defaults-other"),
					"default.js": commandModule(
						"nsmdefaults|*default",
						"defaults-default",
					),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			assert.equal(getLogger(testInjector).warnOutput, "");
			assert.deepEqual(testInjector.getChildrenCommandsNames("nsmdefaults"), [
				"*default",
				"other",
			]);
			assert.isOk(testInjector.resolveCommand("nsmdefaults|*default"));
			assert.deepEqual(capture.loadedModules, ["defaults-default"]);
		});
	});
});
