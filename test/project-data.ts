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

	const projectDir = "projectDir";
	const prepareTest = (opts?: { packageJsonData?: { dependencies?: IStringDictionary, devDependencies: IStringDictionary }, nsconfigData?: { shared?: boolean, webpackConfigPath?: string }, isLegacy?: boolean }): IProjectData => {
		const testInjector = createTestInjector();
		const fs = testInjector.resolve("fs");
		fs.exists = (filePath: string) => filePath && (path.basename(filePath) === "package.json" || (path.basename(filePath) === "nativescript.config.json" && opts && opts.nsconfigData));

		fs.readText = (filePath: string) => {
			if (path.basename(filePath) === "package.json") {
				return JSON.stringify({
          ...(opts && opts.isLegacy ? { nativescript: {
						id: "com.test.testid"
					} } : {}),
					dependencies: opts && opts.packageJsonData && opts.packageJsonData.dependencies,
					devDependencies: opts && opts.packageJsonData && opts.packageJsonData.devDependencies
				});
			} else if (path.basename(filePath) === "nativescript.config.json" && opts && opts.nsconfigData) {
				return JSON.stringify(opts.nsconfigData);
			}

			return null;
		};

		const projectHelper: IProjectHelper = testInjector.resolve("projectHelper");
		projectHelper.projectDir = projectDir;

		const projectData: IProjectData = testInjector.resolve("projectData");
		projectData.initializeProjectData();

		return projectData;
	};

	describe("projectType", () => {

		const assertProjectType = (dependencies: any, devDependencies: any, expectedProjecType: string) => {
			const projectData = prepareTest({
				packageJsonData: {
					dependencies,
					devDependencies
				}
			});
			assert.deepEqual(projectData.projectType, expectedProjecType);
		};

		it("detects project as Angular when @angular/core exists as dependency", () => {
			assertProjectType({ "@angular/core": "*" }, null, "Angular");
		});

		it("detects project as Angular when nativescript-angular exists as dependency", () => {
			assertProjectType({ "nativescript-angular": "*" }, null, "Angular");
    });
    
    it("detects project as Angular when @nativescript/angular exists as dependency", () => {
			assertProjectType({ "@nativescript/angular": "*" }, null, "Angular");
		});

		it("detects project as Vue.js when nativescript-vue exists as dependency", () => {
			assertProjectType({ "nativescript-vue": "*" }, null, "Vue.js");
    });
    
    it("detects project as Vue.js when @nativescript/vue exists as dependency", () => {
			assertProjectType({ "@nativescript/vue": "*" }, null, "Vue.js");
		});

		it("detects project as Vue.js when nativescript-vue exists as dependency and typescript is devDependency", () => {
			assertProjectType({ "nativescript-vue": "*" }, { "typescript": "*" }, "Vue.js");
		});

		it("detects project as React when react-nativescript exists as dependency and typescript is devDependency", () => {
			assertProjectType({ "react-nativescript": "*" }, null, "React");
		});

		it("detects project as Svelte when react-nativescript exists as dependency and typescript is devDependency", () => {
			assertProjectType({ "svelte-native": "*" }, null, "Svelte");
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

	describe("isShared", () => {
		it("is false when nativescript.config.json does not exist", () => {
			const projectData = prepareTest();
			assert.isFalse(projectData.isShared);
		});

		it("is false when nativescript.config.json exists, but shared value is not populated", () => {
			const projectData = prepareTest({ nsconfigData: { shared: undefined } });
			assert.isFalse(projectData.isShared);
		});

		it("is false when nativescript.config.json exists and shared value is false", () => {
			const projectData = prepareTest({ nsconfigData: { shared: false } });
			assert.isFalse(projectData.isShared);
		});

		it("is true when nativescript.config.json exists and shared value is true", () => {
			const projectData = prepareTest({ nsconfigData: { shared: true } });
			assert.isTrue(projectData.isShared);
		});
	});

	describe("webpackConfigPath", () => {
		it("default path to webpack.config.js is set when nativescript.config.json does not set value", () => {
			const projectData = prepareTest();
			assert.equal(projectData.webpackConfigPath, path.join(projectDir, "webpack.config.js"));
		});

		it("returns correct path when full path is set in nativescript.config.json", () => {
			const pathToConfig = path.resolve(path.join("/testDir", "innerDir", "mywebpack.config.js"));
			const projectData = prepareTest({ nsconfigData: { webpackConfigPath: pathToConfig } });
			assert.equal(projectData.webpackConfigPath, pathToConfig);
		});

		it("returns correct path when relative path is set in nativescript.config.json", () => {
			const pathToConfig = path.resolve(path.join("projectDir", "innerDir", "mywebpack.config.js"));
			const projectData = prepareTest({ nsconfigData: { webpackConfigPath: path.join("./innerDir", "mywebpack.config.js") } });
			assert.equal(projectData.webpackConfigPath, pathToConfig);
		});
	});
});
