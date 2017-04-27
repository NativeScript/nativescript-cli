import * as path from "path";
import { BaseServiceTest } from "./base-service-test";
import temp = require("temp");
import { assert } from "chai";
import { PlatformsData } from "../lib/platforms-data";
import { ProjectChangesService } from "../lib/services/project-changes-service";
import * as Constants from "../lib/constants";
import { FileSystem } from "../lib/common/file-system";

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
			for (let platform of ["ios", "android"]) {
				let actualPrepareInfoPath = serviceTest.projectChangesService
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
			for (let platform of ["ios", "android"]) {
				let projectInfo = serviceTest.projectChangesService.getPrepareInfo(platform, this.projectData);

				assert.isNull(projectInfo);
			}
		});

		it("Reads the Prepare Info correctly", () => {
			const fs: FileSystem = serviceTest.resolve("fs");
			for (let platform of ["ios", "android"]) {
				// arrange
				const prepareInfoPath = path.join(serviceTest.projectDir, Constants.PLATFORMS_DIR_NAME,
					platform, ".nsprepareinfo");
				const expectedPrepareInfo = {
					time: new Date().toString(),
					bundle: true,
					release: false,
					changesRequireBuild: true,
					changesRequireBuildTime: new Date().toString(),
					iOSProvisioningProfileUUID: "provisioning_profile_test"
				};
				fs.writeJson(prepareInfoPath, expectedPrepareInfo);

				// act
				let actualPrepareInfo = serviceTest.projectChangesService.getPrepareInfo(platform, this.projectData);

				// assert
				assert.deepEqual(actualPrepareInfo, expectedPrepareInfo);
			}
		});
	});

	describe("Accumulates Changes From Project Services", () => {
		it("accumulates changes from the project service", () => {
			let iOSChanges = serviceTest.projectChangesService.checkForChanges("ios", serviceTest.projectData, { bundle: false, release: false, provision: undefined });
			assert.isTrue(!!iOSChanges.signingChanged, "iOS signingChanged expected to be true");
			let androidChanges = serviceTest.projectChangesService.checkForChanges("android", serviceTest.projectData, { bundle: false, release: false, provision: undefined });
			assert.isFalse(!!androidChanges.signingChanged, "Android signingChanged expected to be false");
		});
	});
});
