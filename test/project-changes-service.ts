import { BaseServiceTest } from "./base-service-test";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import * as _ from "lodash";
import { assert } from "chai";
import { PlatformsDataService } from "../lib/services/platforms-data-service";
import { ProjectChangesService } from "../lib/services/project-changes-service";
import * as Constants from "../lib/constants";
import { FileSystem } from "../lib/common/file-system";
import { HooksServiceStub, LoggerStub } from "./stubs";
import { IProjectData } from "../lib/definitions/project";
import { IPlatformData } from "../lib/definitions/platform";
import { IFileSystem } from "../lib/common/declarations";
import {
	IProjectChangesInfo,
	IPrepareInfo,
} from "../lib/definitions/project-changes";

// start tracking temporary folders/files

class ProjectChangesServiceTest extends BaseServiceTest {
	public projectDir: string;

	constructor() {
		super();
	}

	initInjector(): void {
		this.projectDir = mkdtempSync(path.join(tmpdir(), "projectDir-"));
		this.injector.register("projectData", {
			projectDir: this.projectDir,
		});

		this.injector.register("platformsDataService", PlatformsDataService);
		this.injector.register("androidProjectService", {});
		this.injector.register("iOSProjectService", {});
		this.injector.register("fs", FileSystem);
		this.injector.register("devicePlatformsConstants", {});
		this.injector.register("devicePlatformsConstants", {});
		this.injector.register("projectChangesService", ProjectChangesService);
		this.injector.register("filesHashService", {
			generateHashes: () => Promise.resolve({}),
		});
		this.injector.register("logger", LoggerStub);
		this.injector.register("hooksService", HooksServiceStub);
		this.injector.register("nodeModulesDependenciesBuilder", {});
		this.injector.register("options", {});

		const fs = this.injector.resolve<IFileSystem>("fs");
		fs.writeJson(path.join(this.projectDir, Constants.PACKAGE_JSON_FILE_NAME), {
			nativescript: {
				id: "org.nativescript.test",
			},
		});
	}

	get projectChangesService(): IProjectChangesService {
		return this.injector.resolve("projectChangesService");
	}

	get projectData(): IProjectData {
		return this.injector.resolve("projectData");
	}

	get getNativeProjectDataService(): any {
		return this.injector.resolve("platformsDataService");
	}

	getPlatformData(platform: string): IPlatformData {
		return <any>{
			projectRoot: path.join(
				this.projectDir,
				Constants.PLATFORMS_DIR_NAME,
				platform.toLowerCase(),
			),
			platformProjectService: {
				checkForChanges: async (changesInfo: IProjectChangesInfo) => {
					changesInfo.signingChanged = true;
				},
			},
		};
	}
}

describe("Project Changes Service Tests", () => {
	let serviceTest: ProjectChangesServiceTest;
	beforeEach(() => {
		serviceTest = new ProjectChangesServiceTest();

		const platformsDir = path.join(
			serviceTest.projectDir,
			Constants.PLATFORMS_DIR_NAME,
		);

		serviceTest.getNativeProjectDataService.getPlatformData = (
			platform: string,
		) => {
			if (platform.toLowerCase() === "ios") {
				return {
					projectRoot: path.join(platformsDir, platform),
					get platformProjectService(): any {
						return {
							checkForChanges(changesInfo: IProjectChangesInfo): void {
								changesInfo.signingChanged = true;
							},
						};
					},
				};
			} else {
				return {
					projectRoot: path.join(platformsDir, platform),
					get platformProjectService(): any {
						return {
							checkForChanges(changesInfo: IProjectChangesInfo): void {
								/* no android changes */
							},
						};
					},
				};
			}
		};
	});

	describe("Get Prepare Info File Path", () => {
		it("Gets the correct Prepare Info path for ios/android", () => {
			for (const platform of ["ios", "android"]) {
				const actualPrepareInfoPath =
					serviceTest.projectChangesService.getPrepareInfoFilePath(
						serviceTest.getPlatformData(platform),
					);

				const expectedPrepareInfoPath = path.join(
					serviceTest.projectDir,
					Constants.PLATFORMS_DIR_NAME,
					platform,
					".nsprepareinfo",
				);
				assert.equal(actualPrepareInfoPath, expectedPrepareInfoPath);
			}
		});
	});

	describe("Get Prepare Info", () => {
		it("Returns empty if file path doesn't exists", () => {
			for (const platform of ["ios", "android"]) {
				const projectInfo = serviceTest.projectChangesService.getPrepareInfo(
					serviceTest.getPlatformData(platform),
				);

				assert.isNull(projectInfo);
			}
		});

		it("Reads the Prepare Info correctly", () => {
			const fs: FileSystem = serviceTest.resolve("fs");
			for (const platform of ["ios", "android"]) {
				// arrange
				const prepareInfoPath = path.join(
					serviceTest.projectDir,
					Constants.PLATFORMS_DIR_NAME,
					platform,
					".nsprepareinfo",
				);
				const expectedPrepareInfo: IPrepareInfo = {
					time: new Date().toString(),
					bundle: true,
					release: false,
					changesRequireBuild: true,
					changesRequireBuildTime: new Date().toString(),
					iOSProvisioningProfileUUID: "provisioning_profile_test",
					projectFileHash: "",
					nativePlatformStatus:
						Constants.NativePlatformStatus.requiresPlatformAdd,
					appFilesHashes: {},
				};
				fs.writeJson(prepareInfoPath, expectedPrepareInfo);

				// act
				const actualPrepareInfo =
					serviceTest.projectChangesService.getPrepareInfo(
						serviceTest.getPlatformData(platform),
					);

				// assert
				assert.deepStrictEqual(actualPrepareInfo, expectedPrepareInfo);
			}
		});
	});

	describe("Accumulates Changes From Project Services", () => {
		it("accumulates changes from the project service", async () => {
			const iOSChanges =
				await serviceTest.projectChangesService.checkForChanges(
					serviceTest.getPlatformData("ios"),
					serviceTest.projectData,
					<any>{
						provision: undefined,
						teamId: undefined,
					},
				);
			assert.isTrue(
				!!iOSChanges.signingChanged,
				"iOS signingChanged expected to be true",
			);
		});
	});

	describe("setNativePlatformStatus", () => {
		it("creates prepare info and sets only the native platform status when there isn't an existing prepare info", async () => {
			for (const platform of ["ios", "android"]) {
				await serviceTest.projectChangesService.setNativePlatformStatus(
					serviceTest.getPlatformData(platform),
					serviceTest.projectData,
					{
						nativePlatformStatus:
							Constants.NativePlatformStatus.requiresPrepare,
					},
				);

				const actualPrepareInfo =
					serviceTest.projectChangesService.getPrepareInfo(
						serviceTest.getPlatformData(platform),
					);

				assert.deepStrictEqual(actualPrepareInfo, {
					nativePlatformStatus: Constants.NativePlatformStatus.requiresPrepare,
				});
			}
		});

		it(`shouldn't reset prepare info when native platform status is ${Constants.NativePlatformStatus.alreadyPrepared} and there is existing prepare info`, async () => {
			for (const platform of ["ios", "android"]) {
				await serviceTest.projectChangesService.checkForChanges(
					serviceTest.getPlatformData(platform),
					serviceTest.projectData,
					<any>{},
				);
				await serviceTest.projectChangesService.savePrepareInfo(
					serviceTest.getPlatformData(platform),
					serviceTest.projectData,
					null,
				);
				const prepareInfo = serviceTest.projectChangesService.getPrepareInfo(
					serviceTest.getPlatformData(platform),
				);

				await serviceTest.projectChangesService.setNativePlatformStatus(
					serviceTest.getPlatformData(platform),
					serviceTest.projectData,
					{
						nativePlatformStatus:
							Constants.NativePlatformStatus.alreadyPrepared,
					},
				);

				const actualPrepareInfo =
					serviceTest.projectChangesService.getPrepareInfo(
						serviceTest.getPlatformData(platform),
					);
				prepareInfo.nativePlatformStatus =
					Constants.NativePlatformStatus.alreadyPrepared;
				assert.deepStrictEqual(actualPrepareInfo, prepareInfo);
			}
		});

		_.each(
			[
				Constants.NativePlatformStatus.requiresPlatformAdd,
				Constants.NativePlatformStatus.requiresPrepare,
			],
			(nativePlatformStatus) => {
				it(`should reset prepare info when native platform status is ${nativePlatformStatus} and there is existing prepare info`, async () => {
					for (const platform of ["ios", "android"]) {
						await serviceTest.projectChangesService.checkForChanges(
							serviceTest.getPlatformData(platform),
							serviceTest.projectData,
							<any>{},
						);
						await serviceTest.projectChangesService.setNativePlatformStatus(
							serviceTest.getPlatformData(platform),
							serviceTest.projectData,
							{ nativePlatformStatus: nativePlatformStatus },
						);

						const actualPrepareInfo =
							serviceTest.projectChangesService.getPrepareInfo(
								serviceTest.getPlatformData(platform),
							);
						assert.deepStrictEqual(actualPrepareInfo, {
							nativePlatformStatus: nativePlatformStatus,
						});
					}
				});
			},
		);
	});
});
