import { Yok } from "../../yok";
import { ProjectFilesProviderBase } from "../../services/project-files-provider-base";
import { assert } from "chai";
import * as path from "path";

class ProjectFilesProvider extends ProjectFilesProviderBase {
	constructor($mobileHelper: Mobile.IMobileHelper,
		$options: ICommonOptions) {
		super($mobileHelper, $options);
	}

	public isFileExcluded(filePath: string): boolean {
		throw new Error("Testing ProjectFilesProviderBase should not test abstract member isFileExcluded.");
	}

	public mapFilePath(filePath: string, platform: string): string {
		throw new Error("Testing ProjectFilesProviderBase should not test abstract member mapFilePath.");
	}
}

function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("mobileHelper", {
		platformNames: ["Android", "iOS"]
	});

	testInjector.register("options", { release: false });

	return testInjector;
}

describe("ProjectFilesProviderBase", () => {
	let testInjector: IInjector;
	let projectFilesProviderBase: IProjectFilesProvider;
	const expectedFilePath = path.join("/test", "filePath.ts");

	beforeEach(() => {
		testInjector = createTestInjector();
		projectFilesProviderBase = testInjector.resolve(ProjectFilesProvider);
	});

	describe("getPreparedFilePath", () => {
		it("returns correct path, when fileName does not contain platforms", () => {
			const filePath = "/test/filePath.ts",
				preparedPath = projectFilesProviderBase.getPreparedFilePath(filePath, {});

			assert.deepEqual(preparedPath, expectedFilePath);
		});

		it("returns correct path, when fileName contains android platform", () => {
			const filePath = "/test/filePath.android.ts",
				preparedPath = projectFilesProviderBase.getPreparedFilePath(filePath, {});

			assert.deepEqual(preparedPath, expectedFilePath);
		});

		it("returns correct path, when fileName contains ios platform", () => {
			const filePath = "/test/filePath.iOS.ts",
				preparedPath = projectFilesProviderBase.getPreparedFilePath(filePath, {});

			assert.deepEqual(preparedPath, expectedFilePath);
		});

		it("returns correct path, when fileName contains platform (case insensitive test)", () => {
			const filePath = "/test/filePath.AnDroId.ts",
				preparedPath = projectFilesProviderBase.getPreparedFilePath(filePath, {});

			assert.deepEqual(preparedPath, expectedFilePath);
		});

		it("returns correct path, when fileName contains debug configuration", () => {
			const filePath = "/test/filePath.debug.ts",
				preparedPath = projectFilesProviderBase.getPreparedFilePath(filePath, {});

			assert.deepEqual(preparedPath, expectedFilePath);
		});

		it("returns correct path, when fileName contains debug configuration (case insensitive test)", () => {
			const filePath = "/test/filePath.DebUG.ts",
				preparedPath = projectFilesProviderBase.getPreparedFilePath(filePath, {});

			assert.deepEqual(preparedPath, expectedFilePath);
		});

		it("returns correct path, when fileName contains release configuration", () => {
			const filePath = "/test/filePath.release.ts",
				preparedPath = projectFilesProviderBase.getPreparedFilePath(filePath, {});

			assert.deepEqual(preparedPath, expectedFilePath);
		});
	});

	describe("getProjectFileInfo", () => {
		const getExpectedProjectFileInfo = (filePath: string, shouldIncludeFile: boolean) => {
			return {
				filePath: filePath,
				onDeviceFileName: path.basename(expectedFilePath),
				shouldIncludeFile: shouldIncludeFile
			};
		};

		it("process file without platforms in the name", () => {
			const filePath = "/test/filePath.ts",
				projectFileInfo = projectFilesProviderBase.getProjectFileInfo(filePath, "", {});

			assert.deepEqual(projectFileInfo, getExpectedProjectFileInfo(filePath, true));
		});

		it("process file with android platform in the name", () => {
			const filePath = "/test/filePath.android.ts",
				projectFileInfo = projectFilesProviderBase.getProjectFileInfo(filePath, "android", {});

			assert.deepEqual(projectFileInfo, getExpectedProjectFileInfo(filePath, true));
		});

		it("process file with android platform in the name (case insensitive test)", () => {
			const filePath = "/test/filePath.AndRoID.ts",
				projectFileInfo = projectFilesProviderBase.getProjectFileInfo(filePath, "android", {});

			assert.deepEqual(projectFileInfo, getExpectedProjectFileInfo(filePath, true));
		});

		it("process file with iOS platform in the name", () => {
			const filePath = "/test/filePath.ios.ts",
				projectFileInfo = projectFilesProviderBase.getProjectFileInfo(filePath, "android", {});

			assert.deepEqual(projectFileInfo, getExpectedProjectFileInfo(filePath, false));
		});

		it("process file with debug configuration in the name", () => {
			const filePath = "/test/filePath.debug.ts",
				projectFileInfo = projectFilesProviderBase.getProjectFileInfo(filePath, "android", {});

			assert.deepEqual(projectFileInfo, getExpectedProjectFileInfo(filePath, true));
		});

		it("process file with release configuration in the name", () => {
			const filePath = "/test/filePath.release.ts",
				projectFileInfo = projectFilesProviderBase.getProjectFileInfo(filePath, "android", {});

			assert.deepEqual(projectFileInfo, getExpectedProjectFileInfo(filePath, false));
		});

		it("process file with release configuration in the name, shouldIncludeFile must be true when options.release is true", () => {
			const filePath = "/test/filePath.release.ts";
			testInjector.resolve("options").release = true;
			const projectFileInfo = projectFilesProviderBase.getProjectFileInfo(filePath, "android", { configuration: "release" });

			assert.deepEqual(projectFileInfo, getExpectedProjectFileInfo(filePath, true));
		});
	});
});
