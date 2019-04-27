import * as path from "path";
import { BaseServiceTest } from "./base-service-test";
import temp = require("temp");
import { assert } from "chai";
import { PlatformsData } from "../lib/platforms-data";
import { ProjectChangesService } from "../lib/services/project-changes-service";
import * as Constants from "../lib/constants";
import { FileSystem } from "../lib/common/file-system";
import { HooksServiceStub, LoggerStub } from "./stubs";

// start tracking temporary folders/files
temp.track();

class ProjectChangesServiceTest extends BaseServiceTest {
	public projectDir: string;

	constructor() {
		super();
	}

	initInjector(): void {
		this.projectDir = temp.mkdirSync("projectDir");
		this.injector.register("projectData", {
			projectDir: this.projectDir
		});

		this.injector.register("platformsData", PlatformsData);
		this.injector.register("androidProjectService", {});
		this.injector.register("iOSProjectService", {});
		this.injector.register("fs", FileSystem);
		this.injector.register("devicePlatformsConstants", {});
		this.injector.register("devicePlatformsConstants", {});
		this.injector.register("projectChangesService", ProjectChangesService);
		this.injector.register("filesHashService", {
			generateHashes: () => Promise.resolve({})
		});
		this.injector.register("logger", LoggerStub);
		this.injector.register("hooksService", HooksServiceStub);

		const fs = this.injector.resolve<IFileSystem>("fs");
		fs.writeJson(path.join(this.projectDir, Constants.PACKAGE_JSON_FILE_NAME), {
			nativescript: {
				id: "org.nativescript.test"
			}
		});

	}

	get projectChangesService(): IProjectChangesService {
		return this.injector.resolve("projectChangesService");
	}

	get projectData(): IProjectData {
		return this.injector.resolve("projectData");
	}

	get platformsData(): any {
		return this.injector.resolve("platformsData");
	}
}

describe("Project Changes Service Tests", () => {
	let serviceTest: ProjectChangesServiceTest;
	beforeEach(() => {
		serviceTest = new ProjectChangesServiceTest();

		const platformsDir = path.join(
			serviceTest.projectDir,
			Constants.PLATFORMS_DIR_NAME
		);

		serviceTest.platformsData.getPlatformData =
			(platform: string) => {
				if (platform.toLowerCase() === "ios") {
					return {
						projectRoot: path.join(platformsDir, platform),
						get platformProjectService(): any {
							return {
								checkForChanges(changesInfo: IProjectChangesInfo, options: IProjectChangesOptions, projectData: IProjectData): void {
									changesInfo.signingChanged = true;
								}
							};
						}
					};
				} else {
					return {
						projectRoot: path.join(platformsDir, platform),
						get platformProjectService(): any {
							return {
								checkForChanges(changesInfo: IProjectChangesInfo, options: IProjectChangesOptions, projectData: IProjectData): void { /* no android changes */ }
							};
						}
					};
				}
			};
	});

	describe("Get Prepare Info File Path", () => {
		it("Gets the correct Prepare Info path for ios/android", () => {
			for (const platform of ["ios", "android"]) {
				const actualPrepareInfoPath = serviceTest.projectChangesService
					.getPrepareInfoFilePath(platform, this.projectData);

				const expectedPrepareInfoPath = path.join(serviceTest.projectDir,
					Constants.PLATFORMS_DIR_NAME,
					platform,
					".nsprepareinfo");
				assert.equal(actualPrepareInfoPath, expectedPrepareInfoPath);
			}
		});
	});

	describe("Get Prepare Info", () => {
		it("Returns empty if file path doesn't exists", () => {
			for (const platform of ["ios", "android"]) {
				const projectInfo = serviceTest.projectChangesService.getPrepareInfo(platform, this.projectData);

				assert.isNull(projectInfo);
			}
		});

		it("Reads the Prepare Info correctly", () => {
			const fs: FileSystem = serviceTest.resolve("fs");
			for (const platform of ["ios", "android"]) {
				// arrange
				const prepareInfoPath = path.join(serviceTest.projectDir, Constants.PLATFORMS_DIR_NAME,
					platform, ".nsprepareinfo");
				const expectedPrepareInfo: IPrepareInfo = {
					time: new Date().toString(),
					bundle: true,
					release: false,
					changesRequireBuild: true,
					changesRequireBuildTime: new Date().toString(),
					iOSProvisioningProfileUUID: "provisioning_profile_test",
					projectFileHash: "",
					nativePlatformStatus: Constants.NativePlatformStatus.requiresPlatformAdd,
					appFilesHashes: {}
				};
				fs.writeJson(prepareInfoPath, expectedPrepareInfo);

				// act
				const actualPrepareInfo = serviceTest.projectChangesService.getPrepareInfo(platform, this.projectData);

				// assert
				assert.deepEqual(actualPrepareInfo, expectedPrepareInfo);
			}
		});
	});

	describe("Accumulates Changes From Project Services", () => {
		it("accumulates changes from the project service", async () => {
			const iOSChanges = await serviceTest.projectChangesService.checkForChanges({
				platform: "ios",
				projectData: serviceTest.projectData,
				projectChangesOptions: {
					release: false,
					signingOptions: {
						provision: undefined,
						teamId: undefined,
					},
					useHotModuleReload: false
				}
			});
			assert.isTrue(!!iOSChanges.signingChanged, "iOS signingChanged expected to be true");

			const androidChanges = await serviceTest.projectChangesService.checkForChanges({
				platform: "android",
				projectData: serviceTest.projectData,
				projectChangesOptions: {
					release: false,
					signingOptions: {
						provision: undefined,
						teamId: undefined,
					},
					useHotModuleReload: false
				}
			});
			assert.isFalse(!!androidChanges.signingChanged, "Android signingChanged expected to be false");
		});
	});

	describe("setNativePlatformStatus", () => {
		it("creates prepare info and sets only the native platform status when there isn't an existing prepare info", () => {
			for (const platform of ["ios", "android"]) {
				serviceTest.projectChangesService.setNativePlatformStatus(platform, serviceTest.projectData, { nativePlatformStatus: Constants.NativePlatformStatus.requiresPrepare });

				const actualPrepareInfo = serviceTest.projectChangesService.getPrepareInfo(platform, serviceTest.projectData);

				assert.deepEqual(actualPrepareInfo, { nativePlatformStatus: Constants.NativePlatformStatus.requiresPrepare });
			}
		});

		it(`shouldn't reset prepare info when native platform status is ${Constants.NativePlatformStatus.alreadyPrepared} and there is existing prepare info`, async () => {
			for (const platform of ["ios", "android"]) {
				await serviceTest.projectChangesService.checkForChanges({
					platform,
					projectData: serviceTest.projectData,
					projectChangesOptions: {
						release: false,
						signingOptions: {
							provision: undefined,
							teamId: undefined,
						},
						useHotModuleReload: false
					}
				});
				serviceTest.projectChangesService.savePrepareInfo(platform, serviceTest.projectData);
				const prepareInfo = serviceTest.projectChangesService.getPrepareInfo(platform, serviceTest.projectData);

				serviceTest.projectChangesService.setNativePlatformStatus(platform, serviceTest.projectData, { nativePlatformStatus: Constants.NativePlatformStatus.alreadyPrepared });

				const actualPrepareInfo = serviceTest.projectChangesService.getPrepareInfo(platform, serviceTest.projectData);
				prepareInfo.nativePlatformStatus = Constants.NativePlatformStatus.alreadyPrepared;
				assert.deepEqual(actualPrepareInfo, prepareInfo);
			}
		});

		_.each([Constants.NativePlatformStatus.requiresPlatformAdd, Constants.NativePlatformStatus.requiresPrepare], nativePlatformStatus => {
			it(`should reset prepare info when native platform status is ${nativePlatformStatus} and there is existing prepare info`, async () => {
				for (const platform of ["ios", "android"]) {
					await serviceTest.projectChangesService.checkForChanges({
						platform,
						projectData: serviceTest.projectData,
						projectChangesOptions: {
							release: false,
							signingOptions: {
								provision: undefined,
								teamId: undefined,
							},
							useHotModuleReload: false
						}
					});
					serviceTest.projectChangesService.setNativePlatformStatus(platform, serviceTest.projectData, { nativePlatformStatus: nativePlatformStatus });

					const actualPrepareInfo = serviceTest.projectChangesService.getPrepareInfo(platform, serviceTest.projectData);
					assert.deepEqual(actualPrepareInfo, { nativePlatformStatus: nativePlatformStatus });
				}
			});
		});
	});
});
