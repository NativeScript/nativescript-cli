import { ProjectData } from "../lib/project-data";
import { Yok } from "../lib/common/yok";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { assert } from "chai";
import * as stubs from "./stubs";
import * as path from "path";

describe("projectData", () => {
	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();

		testInjector.register("projectHelper", {
			projectDir: null,
			sanitizeName: (name: string) => name
		});

		testInjector.register("fs", {
			exists: () => true,
			readJson: (): any => null,
			readText: (): any => null
		});

		testInjector.register("staticConfig", {
			CLIENT_NAME_KEY_IN_PROJECT_FILE: "nativescript",
			PROJECT_FILE_NAME: "package.json"
		});

		testInjector.register("errors", stubs.ErrorsStub);

		testInjector.register("logger", stubs.LoggerStub);

		testInjector.register("options", {});

		testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);

		testInjector.register("androidResourcesMigrationService", {
			hasMigrated: () => true
		});

		testInjector.register("projectData", ProjectData);

		return testInjector;
	};

	describe("projectType", () => {

		const assertProjectType = (dependencies: any, devDependencies: any, expectedProjecType: string) => {
			const testInjector = createTestInjector();
			const fs = testInjector.resolve("fs");
			fs.exists = (filePath: string) => filePath && path.basename(filePath) === "package.json";

			fs.readText = () => (JSON.stringify({
				nativescript: {
					id: "com.test.testid"
				},
				dependencies: dependencies,
				devDependencies: devDependencies
			}));

			const projectHelper: IProjectHelper = testInjector.resolve("projectHelper");
			projectHelper.projectDir = "projectDir";

			const projectData: IProjectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();
			assert.deepEqual(projectData.projectType, expectedProjecType);
		};

		it("detects project as Angular when @angular/core exists as dependency", () => {
			assertProjectType({ "@angular/core": "*" }, null, "Angular");
		});

		it("detects project as Angular when nativescript-angular exists as dependency", () => {
			assertProjectType({ "nativescript-angular": "*" }, null, "Angular");
		});

		it("detects project as Vue.js when nativescript-vue exists as dependency", () => {
			assertProjectType({ "nativescript-vue": "*" }, null, "Vue.js");
		});

		it("detects project as Vue.js when nativescript-vue exists as dependency and typescript is devDependency", () => {
			assertProjectType({ "nativescript-vue": "*" }, { "typescript": "*" }, "Vue.js");
		});

		it("detects project as TypeScript when nativescript-dev-typescript exists as dependency", () => {
			assertProjectType(null, { "nativescript-dev-typescript": "*" }, "Pure TypeScript");
		});

		it("detects project as TypeScript when typescript exists as dependency", () => {
			assertProjectType(null, { "typescript": "*" }, "Pure TypeScript");
		});

		it("detects project as JavaScript when no other project type is detected", () => {
			assertProjectType(null, null, "Pure JavaScript");
		});
	});
});
