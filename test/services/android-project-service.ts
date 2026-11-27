import { AndroidProjectService } from "../../lib/services/android-project-service";
import { Yok } from "../../lib/common/yok";
import * as stubs from "../stubs";
import { assert } from "chai";
import * as sinon from "sinon";
import * as path from "path";
import { mkdtempSync, realpathSync } from "fs";
import { tmpdir } from "os";
import { FileSystem } from "../../lib/common/file-system";
import { GradleCommandService } from "../../lib/services/android/gradle-command-service";
import { GradleBuildService } from "../../lib/services/android/gradle-build-service";
import { GradleBuildArgsService } from "../../lib/services/android/gradle-build-args-service";
import { IBuildConfig, IProjectData } from "../../lib/definitions/project";
import {
	IAndroidToolsInfo,
	IAndroidToolsInfoData,
	IAndroidResourcesMigrationService,
	IDependencyData,
} from "../../lib/declarations";
import { IPluginData } from "../../lib/definitions/plugins";
import { IPluginBuildOptions } from "../../lib/definitions/android-plugin-migrator";
import { IInjector } from "../../lib/common/definitions/yok";
import {
	IDictionary,
	IFileSystem,
	IProjectDir,
} from "../../lib/common/declarations";

const createTestInjector = (): IInjector => {
	const testInjector = new Yok();
	testInjector.register("androidProjectService", AndroidProjectService);
	testInjector.register("hooksService", stubs.HooksServiceStub);
	testInjector.register("childProcess", stubs.ChildProcessStub);
	testInjector.register("hostInfo", {});
	testInjector.register("projectDataService", stubs.ProjectDataServiceStub);
	testInjector.register("pluginVariablesService", {});
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("injector", testInjector);
	testInjector.register("devicePlatformsConstants", {});
	testInjector.register("packageManager", {});
	testInjector.register("platformEnvironmentRequirements", {});
	testInjector.register("androidResourcesMigrationService", {});
	testInjector.register("androidPluginBuildService", {});
	testInjector.register("filesHashService", {
		saveHashesForProject: () => ({}),
	});
	testInjector.register("androidPluginBuildService", {});
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("options", {
		hostProjectModuleName: "app",
	});
	testInjector.register("projectData", stubs.ProjectDataStub);
	testInjector.register("androidToolsInfo", {
		getToolsInfo: () => {
			return {
				androidHomeEnvVar: true,
			};
		},
		validateInfo: () => {
			return true;
		},
	});
	testInjector.register("gradleCommandService", GradleCommandService);
	testInjector.register("gradleBuildService", GradleBuildService);
	testInjector.register("gradleBuildArgsService", GradleBuildArgsService);
	testInjector.register("analyticsService", stubs.AnalyticsService);
	testInjector.register("staticConfig", {
		TRACK_FEATURE_USAGE_SETTING_NAME: "TrackFeatureUsage",
	});
	return testInjector;
};

const getDefautlBuildConfig = (): IBuildConfig => {
	return {
		release: true,
		buildForDevice: false,
		iCloudContainerEnvironment: null,
		device: "testDevice",
		provision: null,
		teamId: "",
		projectDir: "location/location",
		keyStorePath: "",
	};
};

describe("androidProjectService", () => {
	let injector: IInjector;
	let androidProjectService: IPlatformProjectService;
	let sandbox: sinon.SinonSandbox = null;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		injector = createTestInjector();
		androidProjectService = injector.resolve("androidProjectService");
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe("buildProject", () => {
		let projectData: IProjectData;
		let childProcess: stubs.ChildProcessStub;

		beforeEach(() => {
			projectData = injector.resolve("projectData");
			childProcess = injector.resolve("childProcess");
			const getPlatformDataStub: sinon.SinonStub = sandbox.stub(
				androidProjectService,
				"getPlatformData",
			);
			getPlatformDataStub.callsFake(() => {
				return {
					configurationFilePath: "",
					getBuildOutputPath: () => "",
				};
			});
		});

		it("release no bundle", async () => {
			//arrange
			const buildConfig = getDefautlBuildConfig();

			//act
			await androidProjectService.buildProject(
				"local/local",
				projectData,
				<any>buildConfig,
			);

			//assert
			assert.include(childProcess.lastCommandArgs, "assembleRelease");
		});

		it("debug no bundle", async () => {
			//arrange
			const buildConfig = getDefautlBuildConfig();
			buildConfig.release = false;

			//act
			await androidProjectService.buildProject(
				"local/local",
				projectData,
				<any>buildConfig,
			);

			//assert
			assert.include(childProcess.lastCommandArgs, "assembleDebug");
		});

		it("release bundle", async () => {
			//arrange
			const buildConfig = getDefautlBuildConfig();
			buildConfig.androidBundle = true;

			//act
			await androidProjectService.buildProject(
				"local/local",
				projectData,
				<any>buildConfig,
			);

			//assert
			assert.include(childProcess.lastCommandArgs, "bundleRelease");
		});

		it("debug bundle", async () => {
			//arrange
			const buildConfig = getDefautlBuildConfig();
			buildConfig.androidBundle = true;
			buildConfig.release = false;

			//act
			await androidProjectService.buildProject(
				"local/local",
				projectData,
				<any>buildConfig,
			);

			//assert
			assert.include(childProcess.lastCommandArgs, "bundleDebug");
		});
	});

	describe("prepareAppResources", () => {
		const projectDir = "testDir";
		const pathToAppResourcesDir = path.join(projectDir, "app", "App_Resources");
		const pathToAppResourcesAndroid = path.join(
			pathToAppResourcesDir,
			"Android",
		);
		const pathToPlatformsAndroid = path.join(
			projectDir,
			"platforms",
			"android",
		);
		const pathToResDirInPlatforms = path.join(
			pathToPlatformsAndroid,
			"app",
			"src",
			"main",
			"res",
		);
		const valuesV27Path = path.join(pathToResDirInPlatforms, "values-v27");
		const valuesV28Path = path.join(pathToResDirInPlatforms, "values-v28");
		const libsPath = path.join(pathToResDirInPlatforms, "libs");
		const drawableHdpiPath = path.join(
			pathToResDirInPlatforms,
			"drawable-hdpi",
		);
		const drawableLdpiPath = path.join(
			pathToResDirInPlatforms,
			"drawable-ldpi",
		);
		let deletedDirs: string[] = [];
		let copiedFiles: {
			sourceFileName: string;
			destinationFileName: string;
		}[] = [];
		let readDirectoryResults: IDictionary<string[]> = {};
		let fs: IFileSystem = null;
		let projectData: IProjectData = null;
		let compileSdkVersion = 29;

		beforeEach(() => {
			projectData = injector.resolve("projectData");
			projectData.projectDir = projectDir;
			projectData.appResourcesDirectoryPath = pathToAppResourcesDir;

			deletedDirs = [];
			copiedFiles = [];
			readDirectoryResults = {};

			fs = injector.resolve<IFileSystem>("fs");
			fs.deleteDirectory = (directory: string): void => {
				deletedDirs.push(directory);
			};
			fs.copyFile = (
				sourceFileName: string,
				destinationFileName: string,
			): void => {
				copiedFiles.push({ sourceFileName, destinationFileName });
			};
			fs.readDirectory = (dir: string): string[] => {
				return readDirectoryResults[dir] || [];
			};

			compileSdkVersion = 29;

			const androidToolsInfo =
				injector.resolve<IAndroidToolsInfo>("androidToolsInfo");
			androidToolsInfo.getToolsInfo = (
				config?: IProjectDir,
			): IAndroidToolsInfoData => {
				return <any>{
					compileSdkVersion,
				};
			};
		});

		describe("when new Android App_Resources structure is detected (post {N} 4.0 structure)", () => {
			const pathToSrcDirInAppResources = path.join(
				pathToAppResourcesAndroid,
				"src",
			);
			beforeEach(() => {
				const androidResourcesMigrationService =
					injector.resolve<IAndroidResourcesMigrationService>(
						"androidResourcesMigrationService",
					);
				androidResourcesMigrationService.hasMigrated = () => true;
			});

			it("copies everything from App_Resources/Android/src to correct location in platforms", async () => {
				await androidProjectService.prepareAppResources(projectData);

				assert.deepStrictEqual(copiedFiles, [
					{
						sourceFileName: path.join(pathToSrcDirInAppResources, "*"),
						destinationFileName: path.join(
							projectData.projectDir,
							"platforms",
							"android",
							"app",
							"src",
						),
					},
				]);
			});

			it("deletes correct values-<sdk> directories based on the compileSdk", async () => {
				readDirectoryResults = {
					[`${pathToResDirInPlatforms}`]: [
						"values",
						"values-v21",
						"values-v26",
						"values-v27",
						"values-v28",
					],
				};

				compileSdkVersion = 26;
				await androidProjectService.prepareAppResources(projectData);
				assert.deepStrictEqual(deletedDirs, [valuesV27Path, valuesV28Path]);
			});

			it("deletes drawable directories when they've been previously prepared", async () => {
				readDirectoryResults = {
					[path.join(pathToSrcDirInAppResources, "main", "res")]: [
						"drawable-hdpi",
						"drawable-ldpi",
						"values",
						"values-v21",
						"values-v29",
					],
					[`${pathToResDirInPlatforms}`]: [
						"drawable-hdpi",
						"drawable-ldpi",
						"drawable-mdpi",
						"values",
						"values-v21",
						"values-v29",
					],
				};

				await androidProjectService.prepareAppResources(projectData);

				// NOTE: Currently the drawable-mdpi directory is not deleted from prepared App_Resources as it does not exist in the currently prepared App_Resources
				// This is not correct behavior and it should be fixed in a later point.
				assert.deepStrictEqual(deletedDirs, [
					drawableHdpiPath,
					drawableLdpiPath,
				]);
			});
		});

		describe("when old Android App_Resources structure is detected (post {N} 4.0 structure)", () => {
			beforeEach(() => {
				const androidResourcesMigrationService =
					injector.resolve<IAndroidResourcesMigrationService>(
						"androidResourcesMigrationService",
					);
				androidResourcesMigrationService.hasMigrated = () => false;
			});

			it("copies everything from App_Resources/Android to correct location in platforms", async () => {
				await androidProjectService.prepareAppResources(projectData);

				assert.deepStrictEqual(copiedFiles, [
					{
						sourceFileName: path.join(pathToAppResourcesAndroid, "*"),
						destinationFileName: pathToResDirInPlatforms,
					},
				]);
			});

			it("deletes correct values-<sdk> directories based on the compileSdk", async () => {
				readDirectoryResults = {
					[`${pathToResDirInPlatforms}`]: [
						"values",
						"values-v21",
						"values-v26",
						"values-v27",
						"values-v28",
					],
				};

				compileSdkVersion = 26;

				await androidProjectService.prepareAppResources(projectData);

				// During preparation of old App_Resources, CLI copies all of them in platforms and after that deletes the libs directory.
				assert.deepStrictEqual(deletedDirs, [
					libsPath,
					valuesV27Path,
					valuesV28Path,
				]);
			});

			it("deletes drawable directories when they've been previously prepared", async () => {
				readDirectoryResults = {
					[`${pathToAppResourcesAndroid}`]: [
						"drawable-hdpi",
						"drawable-ldpi",
						"values",
						"values-v21",
						"values-v29",
					],
					[`${pathToResDirInPlatforms}`]: [
						"drawable-hdpi",
						"drawable-ldpi",
						"drawable-mdpi",
						"values",
						"values-v21",
						"values-v29",
					],
				};

				await androidProjectService.prepareAppResources(projectData);
				// NOTE: Currently the drawable-mdpi directory is not deleted from prepared App_Resources as it does not exist in the currently prepared App_Resources
				// This is not correct behavior and it should be fixed in a later point.
				// During preparation of old App_Resources, CLI copies all of them in platforms and after that deletes the libs directory.
				assert.deepStrictEqual(deletedDirs, [
					drawableHdpiPath,
					drawableLdpiPath,
					libsPath,
				]);
			});
		});
	});
});

describe("androidProjectService plugin aar names", () => {
	let fs: IFileSystem;
	let service: AndroidProjectService;
	let projectDir: string;
	let platformDir: string;
	let dependencies: IDependencyData[];
	let buildAarCalls: IPluginBuildOptions[];
	let outdatedAar: boolean;

	function createProjectData(): IProjectData {
		return <IProjectData>(<unknown>{
			projectDir,
			platformsDir: path.join(projectDir, "platforms"),
			ignoredDependencies: [],
		});
	}

	function addPlugin(plugin: {
		name: string;
		dependencies?: string[];
		native?: boolean;
	}): void {
		const directory = path.join(projectDir, "node_modules", plugin.name);
		const nativescript =
			plugin.native === false ? {} : { platforms: { android: "8.0.0" } };
		fs.writeFile(
			path.join(directory, "platforms", "android", "AndroidManifest.xml"),
			"<manifest/>",
		);
		dependencies.push(<IDependencyData>{
			name: plugin.name,
			directory,
			depth: 0,
			version: "1.0.0",
			nativescript,
			dependencies: plugin.dependencies ?? [],
		});
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

	function addClashingPlugins(): void {
		addPlugin({ name: "@nativescript/core" });
		addPlugin({ name: "@foo/plugin-x", dependencies: ["@nativescript/core"] });
		addPlugin({ name: "@bar/plugin-x" });
	}

	beforeEach(() => {
		projectDir = realpathSync(
			mkdtempSync(path.join(tmpdir(), "android-aar-names-")),
		);
		platformDir = path.join(projectDir, "platforms", "android");
		dependencies = [];
		buildAarCalls = [];
		outdatedAar = false;

		const testInjector = new Yok();
		testInjector.register("injector", testInjector);
		testInjector.register("fs", FileSystem);
		testInjector.register("logger", stubs.LoggerStub);
		testInjector.register("errors", stubs.ErrorsStub);
		testInjector.register("options", {});
		testInjector.register("projectDataService", {});
		testInjector.register("nodeModulesDependenciesBuilder", {
			getProductionDependencies: () => dependencies,
		});
		testInjector.register("androidPluginBuildService", {
			buildAar: async (options: IPluginBuildOptions) => {
				buildAarCalls.push(options);
				return false;
			},
			migrateIncludeGradle: () => false,
			hasOutdatedAar: () => outdatedAar,
		});
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
			testInjector.register(unused, {});
		}
		testInjector.register("androidProjectService", AndroidProjectService);

		fs = testInjector.resolve("fs");
		service = testInjector.resolve("androidProjectService");
	});

	it("writes the same dependencies.json when no short names clash", async () => {
		addPlugin({
			name: "nativescript-plugin",
			dependencies: ["@nativescript/core", "lodash"],
		});
		addPlugin({ name: "@nativescript/core" });
		addPlugin({ name: "lodash", native: false });

		await service.beforePrepareAllPlugins(createProjectData(), dependencies);

		const relative = (name: string) =>
			path.relative(platformDir, path.join(projectDir, "node_modules", name));
		assert.equal(
			fs.readText(path.join(platformDir, "dependencies.json")),
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
	});

	it("builds plugins without a clash under their short name", async () => {
		addClashingPlugins();
		const projectData = createProjectData();
		await service.beforePrepareAllPlugins(projectData, dependencies);

		await service.preparePluginNativeCode(
			pluginData("@nativescript/core"),
			projectData,
		);

		const nativeDir = path.join(
			projectDir,
			"node_modules",
			"@nativescript",
			"core",
			"platforms",
			"android",
		);
		assert.deepStrictEqual(buildAarCalls, [
			{
				gradlePath: undefined,
				gradleArgs: undefined,
				projectDir,
				pluginName: "@nativescript/core",
				platformsAndroidDirPath: nativeDir,
				aarOutputDir: nativeDir,
				tempPluginDirPath: path.join(projectDir, "platforms", "tempPlugin"),
				aarName: "core",
			},
		]);
	});

	it("builds clashing plugins under scope-qualified names", async () => {
		addClashingPlugins();
		const projectData = createProjectData();
		await service.beforePrepareAllPlugins(projectData, dependencies);

		await service.preparePluginNativeCode(
			pluginData("@foo/plugin-x"),
			projectData,
		);
		await service.preparePluginNativeCode(
			pluginData("@bar/plugin-x"),
			projectData,
		);

		assert.deepStrictEqual(
			buildAarCalls.map((options) => options.aarName),
			["foo_plugin_x", "bar_plugin_x"],
		);
	});

	it("works out the aar names when plugins are prepared on their own", async () => {
		addClashingPlugins();

		await service.preparePluginNativeCode(
			pluginData("@bar/plugin-x"),
			createProjectData(),
		);

		assert.equal(buildAarCalls[0].aarName, "bar_plugin_x");
	});

	it("asks for a reprepare when the plugin's aar is outdated", async () => {
		addClashingPlugins();
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

	it("fails prepare when two plugins cannot get distinct aar names", async () => {
		addPlugin({ name: "@foo/plugin-x" });
		addPlugin({ name: "@foo/plugin_x" });

		await assert.isRejected(
			service.beforePrepareAllPlugins(createProjectData(), dependencies),
			/"@foo\/plugin-x" and "@foo\/plugin_x"/,
		);
		assert.isFalse(fs.exists(path.join(platformDir, "dependencies.json")));
	});
});
