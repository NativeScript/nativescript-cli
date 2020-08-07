import { AndroidProjectService } from "../../lib/services/android-project-service";
import { Yok } from "../../lib/common/yok";
import * as stubs from "../stubs";
import { assert } from "chai";
import * as sinon from "sinon";
import * as path from "path";
import { GradleCommandService } from "../../lib/services/android/gradle-command-service";
import { GradleBuildService } from "../../lib/services/android/gradle-build-service";
import { GradleBuildArgsService } from "../../lib/services/android/gradle-build-args-service";

const createTestInjector = (): IInjector => {
	const testInjector = new Yok();
	testInjector.register("androidProjectService", AndroidProjectService);
	testInjector.register("hooksService", stubs.HooksServiceStub);
	testInjector.register("childProcess", stubs.ChildProcessStub);
	testInjector.register("hostInfo", {});
	testInjector.register("projectDataService", stubs.ProjectDataService);
	testInjector.register("pluginVariablesService", {});
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("injector", testInjector);
	testInjector.register("devicePlatformsConstants", {});
	testInjector.register("packageManager", {});
	testInjector.register("platformEnvironmentRequirements", {});
	testInjector.register("androidResourcesMigrationService", {});
	testInjector.register("androidPluginBuildService", {});
	testInjector.register("filesHashService", {
		saveHashesForProject: () => ({})
	});
	testInjector.register("androidPluginBuildService", {});
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("projectData", stubs.ProjectDataStub);
	testInjector.register("androidToolsInfo", {
		getToolsInfo: () => {
			return {
				androidHomeEnvVar: true
			};
		},
		validateInfo: () => {
			return true;
		}
	});
	testInjector.register("gradleCommandService", GradleCommandService);
	testInjector.register("gradleBuildService", GradleBuildService);
	testInjector.register("gradleBuildArgsService", GradleBuildArgsService);
	testInjector.register("analyticsService", stubs.AnalyticsService);
	testInjector.register("staticConfig", { TRACK_FEATURE_USAGE_SETTING_NAME: "TrackFeatureUsage" });
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
		keyStorePath: ""
	};
};

describe("androidProjectService", () => {
	let injector: IInjector;
	let androidProjectService: IPlatformProjectService;
	let sandbox: sinon.SinonSandbox = null;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
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
			const getPlatformDataStub: sinon.SinonStub = sandbox.stub(androidProjectService, "getPlatformData");
			getPlatformDataStub.callsFake(() => {
				return {
					configurationFilePath: "",
					getBuildOutputPath: () => ""
				};
			});
		});

		it("release no bundle", async () => {
			//arrange
			const buildConfig = getDefautlBuildConfig();

			//act
			await androidProjectService.buildProject("local/local", projectData, <any>buildConfig);

			//assert
			assert.include(childProcess.lastCommandArgs, "assembleRelease");
		});

		it("debug no bundle", async () => {
			//arrange
			const buildConfig = getDefautlBuildConfig();
			buildConfig.release = false;

			//act
			await androidProjectService.buildProject("local/local", projectData, <any>buildConfig);

			//assert
			assert.include(childProcess.lastCommandArgs, "assembleDebug");
		});

		it("release bundle", async () => {
			//arrange
			const buildConfig = getDefautlBuildConfig();
			buildConfig.androidBundle = true;

			//act
			await androidProjectService.buildProject("local/local", projectData, <any>buildConfig);

			//assert
			assert.include(childProcess.lastCommandArgs, "bundleRelease");
		});

		it("debug bundle", async () => {
			//arrange
			const buildConfig = getDefautlBuildConfig();
			buildConfig.androidBundle = true;
			buildConfig.release = false;

			//act
			await androidProjectService.buildProject("local/local", projectData, <any>buildConfig);

			//assert
			assert.include(childProcess.lastCommandArgs, "bundleDebug");
		});
	});

	describe("prepareAppResources", () => {
		const projectDir = "testDir";
		const pathToAppResourcesDir = path.join(projectDir, "app", "App_Resources");
		const pathToAppResourcesAndroid = path.join(pathToAppResourcesDir, "Android");
		const pathToPlatformsAndroid = path.join(projectDir, "platforms", "android");
		const pathToResDirInPlatforms = path.join(pathToPlatformsAndroid, "app", "src", "main", "res");
		const valuesV27Path = path.join(pathToResDirInPlatforms, "values-v27");
		const valuesV28Path = path.join(pathToResDirInPlatforms, "values-v28");
		const libsPath = path.join(pathToResDirInPlatforms, "libs");
		const drawableHdpiPath = path.join(pathToResDirInPlatforms, "drawable-hdpi");
		const drawableLdpiPath = path.join(pathToResDirInPlatforms, "drawable-ldpi");
		let deletedDirs: string[] = [];
		let copiedFiles: { sourceFileName: string, destinationFileName: string }[] = [];
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
			fs.copyFile = (sourceFileName: string, destinationFileName: string): void => {
				copiedFiles.push({ sourceFileName, destinationFileName });
			};
			fs.readDirectory = (dir: string): string[] => {
				return readDirectoryResults[dir] || [];
			};

			compileSdkVersion = 29;

			const androidToolsInfo = injector.resolve<IAndroidToolsInfo>("androidToolsInfo");
			androidToolsInfo.getToolsInfo = (config?: IProjectDir): IAndroidToolsInfoData => {
				return <any>{
					compileSdkVersion
				};
			};

		});

		describe("when new Android App_Resources structure is detected (post {N} 4.0 structure)", () => {
			const pathToSrcDirInAppResources = path.join(pathToAppResourcesAndroid, "src");
			beforeEach(() => {
				const androidResourcesMigrationService = injector.resolve<IAndroidResourcesMigrationService>("androidResourcesMigrationService");
				androidResourcesMigrationService.hasMigrated = () => true;
			});

			it("copies everything from App_Resources/Android/src to correct location in platforms", async () => {
				await androidProjectService.prepareAppResources(projectData);

				assert.deepEqual(copiedFiles, [{ sourceFileName: path.join(pathToSrcDirInAppResources, "*"), destinationFileName: path.join(projectData.projectDir, "platforms", "android", "app", "src") }]);
			});

			it("deletes correct values-<sdk> directories based on the compileSdk", async () => {
				readDirectoryResults = {
					[`${pathToResDirInPlatforms}`]: [
						"values",
						"values-v21",
						"values-v26",
						"values-v27",
						"values-v28"
					]
				};

				compileSdkVersion = 26;
				await androidProjectService.prepareAppResources(projectData);
				assert.deepEqual(deletedDirs, [
					valuesV27Path,
					valuesV28Path
				]);
			});

			it("deletes drawable directories when they've been previously prepared", async () => {
				readDirectoryResults = {
					[path.join(pathToSrcDirInAppResources, "main", "res")]: [
						"drawable-hdpi",
						"drawable-ldpi",
						"values",
						"values-v21",
						"values-v29"
					],
					[`${pathToResDirInPlatforms}`]: [
						"drawable-hdpi",
						"drawable-ldpi",
						"drawable-mdpi",
						"values",
						"values-v21",
						"values-v29"
					]
				};

				await androidProjectService.prepareAppResources(projectData);

				// NOTE: Currently the drawable-mdpi directory is not deleted from prepared App_Resources as it does not exist in the currently prepared App_Resources
				// This is not correct behavior and it should be fixed in a later point.
				assert.deepEqual(deletedDirs, [
					drawableHdpiPath,
					drawableLdpiPath
				]);
			});
		});

		describe("when old Android App_Resources structure is detected (post {N} 4.0 structure)", () => {
			beforeEach(() => {
				const androidResourcesMigrationService = injector.resolve<IAndroidResourcesMigrationService>("androidResourcesMigrationService");
				androidResourcesMigrationService.hasMigrated = () => false;
			});

			it("copies everything from App_Resources/Android to correct location in platforms", async () => {
				await androidProjectService.prepareAppResources(projectData);

				assert.deepEqual(copiedFiles, [{ sourceFileName: path.join(pathToAppResourcesAndroid, "*"), destinationFileName: pathToResDirInPlatforms }]);
			});

			it("deletes correct values-<sdk> directories based on the compileSdk", async () => {
				readDirectoryResults = {
					[`${pathToResDirInPlatforms}`]: [
						"values",
						"values-v21",
						"values-v26",
						"values-v27",
						"values-v28"
					]
				};

				compileSdkVersion = 26;

				await androidProjectService.prepareAppResources(projectData);

				// During preparation of old App_Resources, CLI copies all of them in platforms and after that deletes the libs directory.
				assert.deepEqual(deletedDirs, [
					libsPath,
					valuesV27Path,
					valuesV28Path
				]);
			});

			it("deletes drawable directories when they've been previously prepared", async () => {
				readDirectoryResults = {
					[`${pathToAppResourcesAndroid}`]: [
						"drawable-hdpi",
						"drawable-ldpi",
						"values",
						"values-v21",
						"values-v29"
					],
					[`${pathToResDirInPlatforms}`]: [
						"drawable-hdpi",
						"drawable-ldpi",
						"drawable-mdpi",
						"values",
						"values-v21",
						"values-v29"
					]
				};

				await androidProjectService.prepareAppResources(projectData);
				// NOTE: Currently the drawable-mdpi directory is not deleted from prepared App_Resources as it does not exist in the currently prepared App_Resources
				// This is not correct behavior and it should be fixed in a later point.
				// During preparation of old App_Resources, CLI copies all of them in platforms and after that deletes the libs directory.
				assert.deepEqual(deletedDirs, [
					drawableHdpiPath,
					drawableLdpiPath,
					libsPath
				]);
			});
		});
	});
});
