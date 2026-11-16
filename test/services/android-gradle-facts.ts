import { assert } from "chai";
import * as path from "path";
import { mkdtempSync, readFileSync, realpathSync, statSync } from "fs";
import { tmpdir } from "os";
import { createHash } from "crypto";
import Ajv2020, { ValidateFunction } from "ajv/dist/2020";
import { Yok } from "../../lib/common/yok";
import { FileSystem } from "../../lib/common/file-system";
import { AndroidProjectService } from "../../lib/services/android-project-service";
import { AndroidPluginMirrorService } from "../../lib/services/android/android-plugin-mirror-service";
import { IFileSystem } from "../../lib/common/declarations";
import { IDependencyData } from "../../lib/declarations";
import { IPluginData } from "../../lib/definitions/plugins";
import { IProjectData } from "../../lib/definitions/project";
import { IPluginBuildOptions } from "../../lib/definitions/android-plugin-migrator";
import { INativeScriptGradleFacts } from "../../lib/definitions/gradle-facts";
import * as stubs from "../stubs";

const schemaPath = path.resolve(
	__dirname,
	"../../../gradle-api/schema/nativescript-gradle.schema.json",
);

interface IFixturePlugin {
	name: string;
	dependencies?: string[];
	nativeFiles?: { [relativePath: string]: string };
	native?: boolean;
}

describe("android plugin layout and Gradle facts", () => {
	let fs: IFileSystem;
	let service: AndroidProjectService;
	let projectDir: string;
	let platformDir: string;
	let dependencies: IDependencyData[];
	let buildAarCalls: IPluginBuildOptions[];
	let migrateIncludeGradleCalls: IPluginBuildOptions[];
	let outdatedAar: boolean;

	const validateFacts = (() => {
		let validate: ValidateFunction;
		return (facts: unknown) => {
			if (!validate) {
				const ajv = new Ajv2020({ allErrors: true });
				validate = ajv.compile(JSON.parse(readFileSync(schemaPath, "utf8")));
			}
			const valid = validate(facts);
			assert.isTrue(valid, JSON.stringify(validate.errors, null, 2));
		};
	})();

	function createProjectData(readOnlyNodeModules?: boolean): IProjectData {
		return <IProjectData>(<unknown>{
			projectDir,
			platformsDir: path.join(projectDir, "platforms"),
			nsConfig:
				readOnlyNodeModules === undefined
					? {}
					: { android: { readOnlyNodeModules } },
			ignoredDependencies: [],
			getAppDirectoryPath: () => path.join(projectDir, "src"),
			getAppResourcesDirectoryPath: () =>
				path.join(projectDir, "App_Resources"),
		});
	}

	function addPlugin(plugin: IFixturePlugin): IDependencyData {
		const directory = path.join(projectDir, "node_modules", plugin.name);
		const nativescript =
			plugin.native === false ? {} : { platforms: { android: "8.0.0" } };
		fs.writeJson(path.join(directory, "package.json"), {
			name: plugin.name,
			version: "1.0.0",
			nativescript,
		});
		for (const [file, content] of Object.entries(plugin.nativeFiles ?? {})) {
			fs.writeFile(
				path.join(directory, "platforms", "android", ...file.split("/")),
				content,
			);
		}

		const dependency = <IDependencyData>{
			name: plugin.name,
			directory,
			depth: 0,
			version: "1.0.0",
			nativescript,
			dependencies: plugin.dependencies ?? [],
		};
		dependencies.push(dependency);
		return dependency;
	}

	function pluginData(name: string): IPluginData {
		const directory = path.join(projectDir, "node_modules", name);
		return <IPluginData>(<unknown>{
			name,
			fullPath: directory,
			pluginPlatformsFolderPath: (platform: string) =>
				path.join(directory, "platforms", platform),
		});
	}

	const readFacts = (): INativeScriptGradleFacts =>
		fs.readJson(path.join(platformDir, "nativescript-gradle.json"));
	const readDependenciesJson = () =>
		fs.readText(path.join(platformDir, "dependencies.json"));
	const dependenciesJsonSha256 = () =>
		createHash("sha256")
			.update(readFileSync(path.join(platformDir, "dependencies.json")))
			.digest("hex");

	beforeEach(() => {
		projectDir = realpathSync(
			mkdtempSync(path.join(tmpdir(), "gradle-facts-")),
		);
		platformDir = path.join(projectDir, "platforms", "android");
		dependencies = [];
		buildAarCalls = [];
		migrateIncludeGradleCalls = [];
		outdatedAar = false;

		const injector = new Yok();
		injector.register("injector", injector);
		injector.register("fs", FileSystem);
		injector.register("logger", stubs.LoggerStub);
		injector.register("errors", stubs.ErrorsStub);
		injector.register("options", {});
		injector.register("staticConfig", { version: "9.9.9" });
		injector.register("projectDataService", {
			getRuntimePackage: () => ({
				name: "@nativescript/android",
				version: "9.0.0",
			}),
		});
		injector.register("nodeModulesDependenciesBuilder", {
			getProductionDependencies: () => dependencies,
		});
		injector.register("androidPluginBuildService", {
			buildAar: async (options: IPluginBuildOptions) => {
				buildAarCalls.push(options);
				return false;
			},
			migrateIncludeGradle: (options: IPluginBuildOptions) => {
				migrateIncludeGradleCalls.push(options);
				return false;
			},
			hasOutdatedAar: () => outdatedAar,
		});
		injector.register("androidPluginMirrorService", AndroidPluginMirrorService);
		for (const unused of [
			"androidToolsInfo",
			"devicePlatformsConstants",
			"platformEnvironmentRequirements",
			"androidResourcesMigrationService",
			"filesHashService",
			"gradleCommandService",
			"gradleBuildService",
			"analyticsService",
		]) {
			injector.register(unused, {});
		}
		injector.register("androidProjectService", AndroidProjectService);

		fs = injector.resolve("fs");
		service = injector.resolve("androidProjectService");
	});

	function addFixturePlugins() {
		addPlugin({
			name: "@nativescript/core",
			nativeFiles: { "include.gradle": "android {}" },
		});
		addPlugin({
			name: "@foo/plugin-x",
			dependencies: ["@nativescript/core", "lodash"],
			nativeFiles: {
				"AndroidManifest.xml": "<manifest/>",
				"libs/x.jar": "jar",
			},
		});
		addPlugin({
			name: "@bar/plugin-x",
			nativeFiles: { "res/values/strings.xml": "<resources/>" },
		});
		addPlugin({ name: "lodash", native: false });
	}

	describe("default mode", () => {
		it("writes the same dependencies.json as before", async () => {
			addPlugin({
				name: "nativescript-plugin",
				dependencies: ["@nativescript/core", "lodash"],
				nativeFiles: { "AndroidManifest.xml": "<manifest/>" },
			});
			addPlugin({
				name: "@nativescript/core",
				nativeFiles: { "include.gradle": "android {}" },
			});
			addPlugin({ name: "lodash", native: false });

			await service.beforePrepareAllPlugins(createProjectData(), dependencies);

			const relative = (name: string) =>
				path.relative(platformDir, path.join(projectDir, "node_modules", name));
			assert.equal(
				readDependenciesJson(),
				JSON.stringify(
					[
						{
							name: "@nativescript/core",
							directory: relative("@nativescript/core"),
							dependencies: [],
						},
						{
							name: "nativescript-plugin",
							directory: relative("nativescript-plugin"),
							dependencies: ["@nativescript/core"],
						},
					],
					null,
					4,
				),
			);
			assert.isFalse(fs.exists(path.join(platformDir, ".ns-plugins")));
		});

		it("writes facts that point at the packages and match the schema", async () => {
			addFixturePlugins();

			await service.beforePrepareAllPlugins(createProjectData(), dependencies);

			const facts = readFacts();
			validateFacts(facts);
			assert.deepStrictEqual(Object.keys(facts), [
				"schemaVersion",
				"cli",
				"runtime",
				"capabilities",
				"dependenciesJson",
				"project",
				"plugins",
			]);
			assert.deepStrictEqual(facts, {
				schemaVersion: 1,
				cli: { version: "9.9.9" },
				runtime: { name: "@nativescript/android", version: "9.0.0" },
				capabilities: [],
				dependenciesJson: { sha256: dependenciesJsonSha256() },
				project: {
					root: "../..",
					appDir: "../../src",
					appResourcesDir: "../../App_Resources",
				},
				plugins: [
					{
						name: "@nativescript/core",
						packageDir: "../../node_modules/@nativescript/core",
						nativeDir:
							"../../node_modules/@nativescript/core/platforms/android",
						aarName: "core",
						aar: "../../node_modules/@nativescript/core/platforms/android/core.aar",
						dependencies: [],
						options: {},
					},
					{
						name: "@foo/plugin-x",
						packageDir: "../../node_modules/@foo/plugin-x",
						nativeDir: "../../node_modules/@foo/plugin-x/platforms/android",
						aarName: "foo_plugin_x",
						aar: "../../node_modules/@foo/plugin-x/platforms/android/foo_plugin_x.aar",
						dependencies: ["@nativescript/core"],
						options: {},
					},
					{
						name: "@bar/plugin-x",
						packageDir: "../../node_modules/@bar/plugin-x",
						nativeDir: "../../node_modules/@bar/plugin-x/platforms/android",
						aarName: "bar_plugin_x",
						aar: "../../node_modules/@bar/plugin-x/platforms/android/bar_plugin_x.aar",
						dependencies: [],
						options: {},
					},
				],
			});
			assert.deepStrictEqual(
				JSON.parse(readDependenciesJson()).map((dep: any) => dep.name),
				facts.plugins.map((plugin) => plugin.name),
			);
		});

		it("does not rewrite unchanged facts", async () => {
			addFixturePlugins();
			const factsPath = path.join(platformDir, "nativescript-gradle.json");

			await service.beforePrepareAllPlugins(createProjectData(), dependencies);
			fs.utimes(factsPath, new Date(1_000_000), new Date(1_000_000));
			await service.beforePrepareAllPlugins(createProjectData(), dependencies);

			assert.equal(statSync(factsPath).mtime.getTime(), 1_000_000);
		});

		it("builds each plugin into its own package under its unique aar name", async () => {
			addFixturePlugins();
			const projectData = createProjectData();
			await service.beforePrepareAllPlugins(projectData, dependencies);

			await service.preparePluginNativeCode(
				pluginData("@foo/plugin-x"),
				projectData,
			);

			const nativeDir = path.join(
				projectDir,
				"node_modules",
				"@foo",
				"plugin-x",
				"platforms",
				"android",
			);
			assert.deepStrictEqual(buildAarCalls, [
				{
					gradlePath: undefined,
					gradleArgs: undefined,
					projectDir,
					pluginName: "@foo/plugin-x",
					platformsAndroidDirPath: nativeDir,
					aarOutputDir: nativeDir,
					tempPluginDirPath: path.join(projectDir, "platforms", "tempPlugin"),
					gradleFactsFile: path.join(platformDir, "nativescript-gradle.json"),
					aarName: "foo_plugin_x",
				},
			]);
			assert.equal(
				migrateIncludeGradleCalls[0].platformsAndroidDirPath,
				nativeDir,
			);
		});

		it("works out the aar names when plugins are prepared on their own", async () => {
			addFixturePlugins();

			await service.preparePluginNativeCode(
				pluginData("@bar/plugin-x"),
				createProjectData(),
			);

			assert.equal(buildAarCalls[0].aarName, "bar_plugin_x");
		});

		it("asks for a reprepare when the plugin's aar is outdated", async () => {
			addFixturePlugins();
			const projectData = createProjectData();
			await service.beforePrepareAllPlugins(projectData, dependencies);

			assert.isFalse(
				service.shouldRepreparePlugin(pluginData("@foo/plugin-x"), projectData),
			);
			outdatedAar = true;
			assert.isTrue(
				service.shouldRepreparePlugin(pluginData("@foo/plugin-x"), projectData),
			);
		});

		it("fails when two plugins cannot get distinct aar names", async () => {
			addPlugin({ name: "@foo/plugin-x", nativeFiles: { "a.txt": "" } });
			addPlugin({ name: "@foo/plugin_x", nativeFiles: { "a.txt": "" } });

			await assert.isRejected(
				service.beforePrepareAllPlugins(createProjectData(), dependencies),
				/"@foo\/plugin-x" and "@foo\/plugin_x"/,
			);
		});
	});

	describe("read-only node_modules", () => {
		it("points dependencies.json and the facts at CLI-owned copies", async () => {
			addFixturePlugins();

			await service.beforePrepareAllPlugins(
				createProjectData(true),
				dependencies,
			);

			assert.deepStrictEqual(JSON.parse(readDependenciesJson()), [
				{
					name: "@nativescript/core",
					directory: path.join(".ns-plugins", "core"),
					dependencies: [],
				},
				{
					name: "@foo/plugin-x",
					directory: path.join(".ns-plugins", "foo_plugin_x"),
					dependencies: ["@nativescript/core"],
				},
				{
					name: "@bar/plugin-x",
					directory: path.join(".ns-plugins", "bar_plugin_x"),
					dependencies: [],
				},
			]);

			const facts = readFacts();
			validateFacts(facts);
			assert.equal(facts.dependenciesJson.sha256, dependenciesJsonSha256());
			assert.deepStrictEqual(facts.plugins[1], {
				name: "@foo/plugin-x",
				packageDir: "../../node_modules/@foo/plugin-x",
				nativeDir: ".ns-plugins/foo_plugin_x/platforms/android",
				aarName: "foo_plugin_x",
				aar: ".ns-plugins/foo_plugin_x/platforms/android/foo_plugin_x.aar",
				dependencies: ["@nativescript/core"],
				options: {},
			});

			const mirrorDir = path.join(platformDir, ".ns-plugins", "foo_plugin_x");
			assert.equal(
				fs.readJson(path.join(mirrorDir, "package.json")).name,
				"@foo/plugin-x",
			);
			assert.equal(
				fs.readText(
					path.join(mirrorDir, "platforms", "android", "libs", "x.jar"),
				),
				"jar",
			);
		});

		it("builds from the package into the copy", async () => {
			addFixturePlugins();
			const projectData = createProjectData(true);
			await service.beforePrepareAllPlugins(projectData, dependencies);

			await service.preparePluginNativeCode(
				pluginData("@foo/plugin-x"),
				projectData,
			);

			const mirrorNativeDir = path.join(
				platformDir,
				".ns-plugins",
				"foo_plugin_x",
				"platforms",
				"android",
			);
			assert.deepInclude(buildAarCalls[0], {
				platformsAndroidDirPath: path.join(
					projectDir,
					"node_modules",
					"@foo",
					"plugin-x",
					"platforms",
					"android",
				),
				aarOutputDir: mirrorNativeDir,
				aarName: "foo_plugin_x",
				readOnlyNodeModules: true,
			});
			assert.equal(
				migrateIncludeGradleCalls[0].platformsAndroidDirPath,
				mirrorNativeDir,
			);
		});

		it("asks for a reprepare of plugins whose copy changed until they are prepared", async () => {
			addFixturePlugins();
			const projectData = createProjectData(true);
			const foo = pluginData("@foo/plugin-x");

			await service.beforePrepareAllPlugins(projectData, dependencies);
			assert.isTrue(service.shouldRepreparePlugin(foo, projectData));

			await service.preparePluginNativeCode(foo, projectData);
			assert.isFalse(service.shouldRepreparePlugin(foo, projectData));

			await service.beforePrepareAllPlugins(projectData, dependencies);
			assert.isFalse(service.shouldRepreparePlugin(foo, projectData));
		});

		it("skips plugins that Gradle does not read", async () => {
			addFixturePlugins();
			fs.writeFile(
				path.join(
					projectDir,
					"node_modules",
					"lodash",
					"platforms",
					"android",
					"AndroidManifest.xml",
				),
				"<manifest/>",
			);
			const projectData = createProjectData(true);
			await service.beforePrepareAllPlugins(projectData, dependencies);

			await service.preparePluginNativeCode(pluginData("lodash"), projectData);

			assert.deepStrictEqual(buildAarCalls, []);
		});

		it("drops the copies when switched off", async () => {
			addFixturePlugins();
			await service.beforePrepareAllPlugins(
				createProjectData(true),
				dependencies,
			);
			assert.isTrue(fs.exists(path.join(platformDir, ".ns-plugins")));

			await service.beforePrepareAllPlugins(
				createProjectData(false),
				dependencies,
			);

			assert.isFalse(fs.exists(path.join(platformDir, ".ns-plugins")));
			validateFacts(readFacts());
			assert.equal(
				readFacts().plugins[0].nativeDir,
				"../../node_modules/@nativescript/core/platforms/android",
			);
		});
	});
});
