import { Yok } from "../../../src/common/yok";
import { XcodebuildService } from "../../../src/services/ios/xcodebuild-service";
import * as path from "path";
import { assert } from "chai";

const projectRoot = "path/to/my/app/folder/platforms/ios";
const projectName = "myApp";
const buildOutputPath = path.join(projectRoot, projectName, "archive");
const exportOptionsPlistOutput = {
	exportFileDir: buildOutputPath,
	exportFilePath: path.join(buildOutputPath, `${projectName}.ipa`),
	exportOptionsPlistFilePath: "/my/temp/options/plist/file/path"
};
let actualBuildArgs: string[] = [];
let actualBuildOptions:IXcodebuildCommandOptions = null;

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("exportOptionsPlistService", {
		createDevelopmentExportOptionsPlist: async () => exportOptionsPlistOutput,
		createDistributionExportOptionsPlist: async () => exportOptionsPlistOutput
	});
	injector.register("xcodebuildArgsService", {
		getBuildForDeviceArgs: async () => <string[]>[],
		getBuildForSimulatorArgs: async () => <string[]>[]
	});
	injector.register("xcodebuildCommandService", {
		executeCommand: async (args: string[], options: IXcodebuildCommandOptions) => {
			actualBuildArgs = args;
			actualBuildOptions = options;
		}
	});

	injector.register("xcodebuildService", XcodebuildService);

	return injector;
}

describe("xcodebuildService", () => {
	describe("buildForDevice", () => {
		it("should build correctly for device", async () => {
			const injector = createTestInjector();
			const xcodebuildService = injector.resolve("xcodebuildService");
			const platformData = { getBuildOutputPath: () => buildOutputPath, projectRoot };
			const projectData = { projectName };

			const buildResult = await xcodebuildService.buildForDevice(platformData, projectData, { });

			const expectedBuildArgs = [
				'-exportArchive',
				'-archivePath', path.join(platformData.getBuildOutputPath(), `${projectName}.xcarchive`),
				'-exportPath', exportOptionsPlistOutput.exportFileDir,
				'-exportOptionsPlist', exportOptionsPlistOutput.exportOptionsPlistFilePath
			];
			assert.deepEqual(actualBuildArgs, expectedBuildArgs);
			assert.deepEqual(actualBuildOptions, { cwd: projectRoot, stdio: undefined });
			assert.deepEqual(buildResult, exportOptionsPlistOutput.exportFilePath);
		});
	});
	describe("buildForSimulator", () => {
		it("should build correctly for simulator", async () => {
			const injector = createTestInjector();
			const xcodebuildService = injector.resolve("xcodebuildService");
			const platformData = { getBuildOutputPath: () => buildOutputPath, projectRoot };
			const projectData = { projectName };

			await xcodebuildService.buildForSimulator(platformData, projectData, {});

			assert.deepEqual(actualBuildArgs, []);
			assert.deepEqual(actualBuildOptions, { cwd: projectRoot, stdio: undefined });
		});
	});
	describe("buildForAppStore", () => {
		it("should build correctly for Appstore", async () => {
			const injector = createTestInjector();
			const xcodebuildService = injector.resolve("xcodebuildService");
			const platformData = { getBuildOutputPath: () => buildOutputPath, projectRoot };
			const projectData = { projectName };

			const buildResult = await xcodebuildService.buildForAppStore(platformData, projectData, {});

			const expectedBuildArgs = [
				'-exportArchive',
				'-archivePath', path.join(platformData.getBuildOutputPath(), `${projectName}.xcarchive`),
				'-exportPath', exportOptionsPlistOutput.exportFileDir,
				'-exportOptionsPlist', exportOptionsPlistOutput.exportOptionsPlistFilePath
			];
			assert.deepEqual(actualBuildArgs, expectedBuildArgs);
			assert.deepEqual(actualBuildOptions, { cwd: projectRoot });
			assert.deepEqual(buildResult, exportOptionsPlistOutput.exportFilePath);
		});
	});
});
