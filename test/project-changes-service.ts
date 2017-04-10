import * as path from "path";
import { BaseServiceTest } from "./base-service-test";
import temp = require("temp");
import { assert } from "chai";
import { PlatformsData } from "../lib/platforms-data";
import { ProjectChangesService } from "../lib/services/project-changes-service";
import * as Constants from "../lib/constants";

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
        
		this.injector.register("fs", {});
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

describe.only("Project Changes Service Tests", () => {
    let serviceTest: ProjectChangesServiceTest;
    beforeEach(() => {
        serviceTest = new ProjectChangesServiceTest();
    });

    describe("Get Prepare Info File Path", () => {
        beforeEach(() => {
            const platformsDir = path.join(
                serviceTest.projectDir,
                Constants.PLATFORMS_DIR_NAME
            );

            serviceTest.platformsData.getPlatformData = 
                (platform: string) => {
                    return { 
                        projectRoot: path.join(platformsDir, platform)
                    };
                };
        });

        it("Gets the correct Prepare Info path for ios/android", () => {;
            for(let os of ["ios", "android"]) {
                let actualPrepareInfoPath = serviceTest.projectChangesService
                    .getPrepareInfoFilePath(os, this.projectData);

                const expectedPrepareInfoPath = path.join(serviceTest.projectDir,
                    Constants.PLATFORMS_DIR_NAME,
                    os,
                    ".nsprepareinfo");
                assert.equal(actualPrepareInfoPath, expectedPrepareInfoPath);                
            }        
        });
    });
});