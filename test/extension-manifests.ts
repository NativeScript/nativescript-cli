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

		const definitionModule = (commandName: string, marker: string): string =>
			`const { defineCommand } = require(${JSON.stringify(contractsPath)});
			global.__nsmCapture.loadedModules.push(${JSON.stringify(marker)});
			module.exports = defineCommand({
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

		it("resolves the hierarchical parent dispatcher before any child module has loaded", async () => {
			const extensionName = "nsm-defp-ext";
			writeExtension(
				extensionName,
				{ commands: { "nsmdefp|go": "./dist/go.js" } },
				{
					"main.js": mainModule("defp-main"),
					"dist/go.js": definitionModule("nsmdefp|go", "defp-go"),
				},
			);

			const extensibilityService = resolveService(testInjector);
			await extensibilityService.loadExtension(extensionName);

			// Dispatch hits the parent first; its record must load the child module
			// so the dispatcher the child's registration synthesizes exists.
			const parent = <any>testInjector.resolveCommand("nsmdefp");
			assert.isOk(parent);
			assert.isTrue(parent.isHierarchicalCommand);
			assert.include(capture.loadedModules, "defp-go");

			const child = testInjector.resolveCommand("nsmdefp|go");
			assert.isOk(child);
		});
	});
});
