import { Yok } from "../lib/common/yok";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { assert } from "chai";
import * as stubs from "./stubs";
import * as path from "path";
import { IProjectData } from "../lib/definitions/project";
import { IInjector } from "../lib/common/definitions/yok";
import { IStringDictionary, IProjectHelper } from "../lib/common/declarations";
import { ProjectConfigService } from "../lib/services/project-config-service";
import { ProjectData } from "../lib/project-data";

describe("projectData", () => {
	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();

		testInjector.register("projectHelper", {
			projectDir: null,
			sanitizeName: (name: string) => name,
		});

		testInjector.register("fs", {
			exists: () => true,
			readJson: (): any => null,
			readText: (): any => null,
		});

		testInjector.register("staticConfig", {
			CLIENT_NAME_KEY_IN_PROJECT_FILE: "nativescript",
			PROJECT_FILE_NAME: "package.json",
		});

		testInjector.register("errors", stubs.ErrorsStub);

		testInjector.register("logger", stubs.LoggerStub);

		testInjector.register("options", {});

		testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);

		testInjector.register("androidResourcesMigrationService", {
			hasMigrated: () => true,
		});
		testInjector.register("projectData", ProjectData);

		testInjector.register("projectConfigService", ProjectConfigService);

		return testInjector;
	};

	const projectDir = "projectDir";
	const prepareTest = (opts?: {
		packageJsonData?: {
			dependencies?: IStringDictionary;
			devDependencies: IStringDictionary;
		};
		configData?: {
			shared?: boolean;
			webpackConfigPath?: string;
			bundlerConfigPath?: string;
			projectName?: string;
			bundler?: string;
		};
	}): IProjectData => {
		const testInjector = createTestInjector();
		const fs = testInjector.resolve("fs");
		testInjector.register(
			"projectConfigService",
			stubs.ProjectConfigServiceStub.initWithConfig(opts?.configData),
		);

		fs.exists = (filePath: string) => {
			return filePath && path.basename(filePath) === "package.json";
		};

		fs.readText = (filePath: string) => {
			if (path.basename(filePath) === "package.json") {
				return JSON.stringify({
					dependencies:
						opts && opts.packageJsonData && opts.packageJsonData.dependencies,
					devDependencies:
						opts &&
						opts.packageJsonData &&
						opts.packageJsonData.devDependencies,
				});
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
		const assertProjectType = (
			dependencies: any,
			devDependencies: any,
			expectedProjecType: string,
		) => {
			const projectData = prepareTest({
				packageJsonData: {
					dependencies,
					devDependencies,
				},
			});
			assert.deepStrictEqual(projectData.projectType, expectedProjecType);
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
			assertProjectType(
				{ "nativescript-vue": "*" },
				{ typescript: "*" },
				"Vue.js",
			);
		});

		it("detects project as React when react-nativescript exists as dependency and typescript is devDependency", () => {
			assertProjectType({ "react-nativescript": "*" }, null, "React");
		});

		it("detects project as Svelte when svelte-native exists as dependency and typescript is devDependency", () => {
			assertProjectType({ "svelte-native": "*" }, null, "Svelte");
		});

		it("detects project as TypeScript when nativescript-dev-typescript exists as dependency", () => {
			assertProjectType(
				null,
				{ "nativescript-dev-typescript": "*" },
				"Pure TypeScript",
			);
		});

		it("detects project as TypeScript when typescript exists as dependency", () => {
			assertProjectType(null, { typescript: "*" }, "Pure TypeScript");
		});

		it("detects project as JavaScript when no other project type is detected", () => {
			assertProjectType(null, null, "Pure JavaScript");
		});
	});

	describe("isShared", () => {
		it("is false when nsconfig.json does not exist", () => {
			const projectData = prepareTest();
			assert.isFalse(projectData.isShared);
		});

		it("is false when nsconfig.json exists, but shared value is not populated", () => {
			const projectData = prepareTest({ configData: { shared: undefined } });
			assert.isFalse(projectData.isShared);
		});

		it("is false when nsconfig.json exists and shared value is false", () => {
			const projectData = prepareTest({ configData: { shared: false } });
			assert.isFalse(projectData.isShared);
		});

		it("is true when nsconfig.json exists and shared value is true", () => {
			const projectData = prepareTest({ configData: { shared: true } });
			assert.isTrue(projectData.isShared);
		});
	});

	describe("projectName", () => {
		it("has correct name when no value is set in nativescript.conf", () => {
			const projectData = prepareTest();
			assert.isString("projectDir", projectData.projectName);
		});

		it("has correct name when a project name is set in nativescript.conf", () => {
			const projectData = prepareTest({
				configData: { projectName: "specifiedProjectName" },
			});
			assert.isString("specifiedProjectName", projectData.projectName);
		});
	});

	describe("webpackConfigPath", () => {
		it("default path to webpack.config.js is set when nsconfig.json does not set value", () => {
			const projectData = prepareTest();
			assert.equal(
				projectData.webpackConfigPath,
				path.join(projectDir, "webpack.config.js"),
			);
		});

		it("returns correct path when full path is set in nsconfig.json", () => {
			const pathToConfig = path.resolve(
				path.join("/testDir", "innerDir", "mywebpack.config.js"),
			);
			const projectData = prepareTest({
				configData: { webpackConfigPath: pathToConfig },
			});
			assert.equal(projectData.webpackConfigPath, pathToConfig);
		});

		it("returns correct path when relative path is set in nsconfig.json", () => {
			const pathToConfig = path.resolve(
				path.join("projectDir", "innerDir", "mywebpack.config.js"),
			);
			const projectData = prepareTest({
				configData: {
					webpackConfigPath: path.join("./innerDir", "mywebpack.config.js"),
				},
			});
			assert.equal(projectData.webpackConfigPath, pathToConfig);
		});
	});

	describe("bundlerConfigPath", () => {
		it("default path to webpack.config.js is set when nsconfig.json does not set value", () => {
			const projectData = prepareTest();
			assert.equal(
				projectData.bundlerConfigPath,
				path.join(projectDir, "webpack.config.js"),
			);
		});

		it("should use webpackConfigPath property when bundlerConfigPath is not defined", () => {
			const pathToConfig = path.resolve(
				path.join("/testDir", "innerDir", "mywebpack.config.js"),
			);
			const projectData = prepareTest({
				configData: { webpackConfigPath: pathToConfig },
			});
			assert.equal(projectData.bundlerConfigPath, pathToConfig);
		});

		it("returns correct path when full path is set in nsconfig.json", () => {
			const pathToConfig = path.resolve(
				path.join("/testDir", "innerDir", "mywebpack.config.js"),
			);
			const projectData = prepareTest({
				configData: { bundlerConfigPath: pathToConfig },
			});
			assert.equal(projectData.bundlerConfigPath, pathToConfig);
		});

		it("returns correct path when relative path is set in nsconfig.json", () => {
			const pathToConfig = path.resolve(
				path.join("projectDir", "innerDir", "mywebpack.config.js"),
			);
			const projectData = prepareTest({
				configData: {
					bundlerConfigPath: path.join("./innerDir", "mywebpack.config.js"),
				},
			});
			assert.equal(projectData.bundlerConfigPath, pathToConfig);
		});

		it("should use bundlerConfigPath instead of webpackConfigPath if both are defined.", () => {
			const pathToConfig = path.resolve(
				path.join("projectDir", "innerDir", "myrspack.config.js"),
			);
			const projectData = prepareTest({
				configData: {
					webpackConfigPath: path.join("./innerDir", "mywebpack.config.js"),
					bundlerConfigPath: path.join("./innerDir", "myrspack.config.js"),
				},
			});
			assert.equal(projectData.bundlerConfigPath, pathToConfig);
		});
	});

	describe("bundler", () => {
		it("sets bundler to 'webpack' by default when nsconfig.json does not specify a bundler", () => {
			const projectData = prepareTest();
			assert.equal(projectData.bundler, "webpack");
		});

		it("sets bundler to 'webpack' when explicitly defined in nsconfig.json", () => {
			const projectData = prepareTest({ configData: { bundler: "webpack" } });
			assert.equal(projectData.bundler, "webpack");
		});

		it("sets bundler to 'rspack' when explicitly defined in nsconfig.json", () => {
			const projectData = prepareTest({ configData: { bundler: "rspack" } });
			assert.equal(projectData.bundler, "rspack");
		});

		it("sets bundler to 'vite' when explicitly defined in nsconfig.json", () => {
			const projectData = prepareTest({ configData: { bundler: "vite" } });
			assert.equal(projectData.bundler, "vite");
		});
	});
});
