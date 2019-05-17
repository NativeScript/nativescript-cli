import { AndroidProjectService } from "../../lib/services/android-project-service";
import { Yok } from "../../lib/common/yok";
import * as stubs from "../stubs";
import { assert } from "chai";
import * as sinon from "sinon";
import { GradleCommandService } from "../../lib/services/android/gradle-command-service";
import { GradleBuildService } from "../../lib/services/android/gradle-build-service";
import { GradleBuildArgsService } from "../../lib/services/android/gradle-build-args-service";

const createTestInjector = (): IInjector => {
	const testInjector = new Yok();
	testInjector.register("androidProjectService", AndroidProjectService);
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

describe("androidDeviceDebugService", () => {
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

	describe("buildPlatform", () => {
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
});
