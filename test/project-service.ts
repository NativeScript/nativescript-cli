/// <reference path=".d.ts" />
"use strict";

import * as yok from "../lib/common/yok";
import * as stubs from "./stubs";
import * as constants from "./../lib/constants";
import {ChildProcess} from "../lib/common/child-process";
import * as ProjectServiceLib from "../lib/services/project-service";
import * as ProjectDataServiceLib from "../lib/services/project-data-service";
import * as ProjectDataLib from "../lib/project-data";
import * as ProjectHelperLib from "../lib/common/project-helper";
import {StaticConfig} from "../lib/config";
import * as NpmLib from "../lib/node-package-manager";
import {NpmInstallationManager} from "../lib/npm-installation-manager";
import * as HttpClientLib from "../lib/common/http-client";
import {FileSystem} from "../lib/common/file-system";
import * as path from "path";
import temp = require("temp");
import * as helpers from "../lib/common/helpers";
import {assert} from "chai";
import {Options} from "../lib/options";
import {HostInfo} from "../lib/common/host-info";
import {ProjectTemplatesService} from "../lib/services/project-templates-service";

let mockProjectNameValidator = {
	validate: () => { return true; }
};

temp.track();

class ProjectIntegrationTest {
	public testInjector: IInjector;

	constructor() {
		this.createTestInjector();
	}

	public createProject(projectName: string, template?: string): IFuture<void> {
		let projectService = this.testInjector.resolve("projectService");
		return projectService.createProject(projectName, template);
	}

	public getNpmPackagePath(packageName: string): IFuture<string> {
		return (() => {
			let npmInstallationManager = this.testInjector.resolve("npmInstallationManager");
			let fs = this.testInjector.resolve("fs");

			let cacheRoot = npmInstallationManager.getCacheRootPath();
			let defaultTemplatePath = path.join(cacheRoot, packageName);
			let latestVersion = npmInstallationManager.getLatestVersion(packageName).wait();

			if(!fs.exists(path.join(defaultTemplatePath, latestVersion)).wait()) {
				npmInstallationManager.addToCache(packageName, latestVersion).wait();
			}
			if(!fs.exists(path.join(defaultTemplatePath, latestVersion, "package", "app")).wait()) {
				npmInstallationManager.cacheUnpack(packageName, latestVersion).wait();
			}

			return path.join(defaultTemplatePath, latestVersion, "package");
		}).future<string>()();
	}

	public assertProject(tempFolder: string, projectName: string, appId: string, projectSourceDirectory?: string): IFuture<void> {
		return (() => {
			let fs: IFileSystem = this.testInjector.resolve("fs");
			let projectDir = path.join(tempFolder, projectName);
			let appDirectoryPath = path.join(projectDir, "app");
			let platformsDirectoryPath = path.join(projectDir, "platforms");
			let tnsProjectFilePath = path.join(projectDir, "package.json");
			let tnsModulesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, constants.TNS_CORE_MODULES_NAME);
			let packageJsonContent = fs.readJson(tnsProjectFilePath).wait();
			let options = this.testInjector.resolve("options");

			assert.isTrue(fs.exists(appDirectoryPath).wait());
			assert.isTrue(fs.exists(platformsDirectoryPath).wait());
			assert.isTrue(fs.exists(tnsProjectFilePath).wait());
			assert.isTrue(fs.exists(tnsModulesPath).wait());

			assert.isFalse(fs.isEmptyDir(appDirectoryPath).wait());
			assert.isTrue(fs.isEmptyDir(platformsDirectoryPath).wait());

			let actualAppId = packageJsonContent["nativescript"].id;
			let expectedAppId = appId;
			assert.equal(actualAppId, expectedAppId);

			let tnsCoreModulesRecord = packageJsonContent["dependencies"][constants.TNS_CORE_MODULES_NAME];
			assert.isTrue(tnsCoreModulesRecord !== null);

			let sourceDir = projectSourceDirectory || options.copyFrom;

			let expectedFiles = fs.enumerateFilesInDirectorySync(sourceDir);
			let actualFiles = fs.enumerateFilesInDirectorySync(appDirectoryPath);
			assert.isTrue(actualFiles.length >= expectedFiles.length, "Files in created project must be at least as files in app dir.");
			_.each(expectedFiles, file => {
				let relativeToProjectDir = helpers.getRelativeToRootPath(sourceDir, file);
				let filePathInApp = path.join(appDirectoryPath, relativeToProjectDir);
				assert.isTrue(fs.exists(filePathInApp).wait(), `File ${filePathInApp} does not exist.`);
			});

			// assert dependencies and devDependencies are copied from template to real project
			let sourcePackageJsonContent = fs.readJson(path.join(sourceDir, "package.json")).wait();
			let missingDeps = _.difference(_.keys(sourcePackageJsonContent.dependencies), _.keys(packageJsonContent.dependencies));
			let missingDevDeps = _.difference(_.keys(sourcePackageJsonContent.devDependencies), _.keys(packageJsonContent.devDependencies));
			assert.deepEqual(missingDeps, [], `All dependencies from template must be copied to project's package.json. Missing ones are: ${missingDeps.join(", ")}.`);
			assert.deepEqual(missingDevDeps, [], `All devDependencies from template must be copied to project's package.json. Missing ones are: ${missingDevDeps.join(", ")}.`);

			// assert App_Resources are prepared correctly
			let appResourcesDir = path.join(appDirectoryPath, "App_Resources");
			let appResourcesContents = fs.readDirectory(appResourcesDir).wait();
			assert.deepEqual(appResourcesContents, ["Android", "iOS"], "Project's app/App_Resources must contain Android and iOS directories.");
		}).future<void>()();
	}

	public dispose(): void {
		this.testInjector = undefined;
	}

	private createTestInjector(): void {
		this.testInjector = new yok.Yok();
		this.testInjector.register("childProcess", ChildProcess);
		this.testInjector.register("errors", stubs.ErrorsStub);
		this.testInjector.register('logger', stubs.LoggerStub);
		this.testInjector.register("projectService", ProjectServiceLib.ProjectService);
		this.testInjector.register("projectHelper", ProjectHelperLib.ProjectHelper);
		this.testInjector.register("projectTemplatesService", ProjectTemplatesService);
		this.testInjector.register("projectNameValidator", mockProjectNameValidator);

		this.testInjector.register("fs", FileSystem);
		this.testInjector.register("projectDataService", ProjectDataServiceLib.ProjectDataService);
		this.testInjector.register("staticConfig", StaticConfig);

		this.testInjector.register("npmInstallationManager", NpmInstallationManager);
		this.testInjector.register("npm", NpmLib.NodePackageManager);
		this.testInjector.register("httpClient", HttpClientLib.HttpClient);
		this.testInjector.register("lockfile", stubs.LockFile);

		this.testInjector.register("options", Options);
		this.testInjector.register("hostInfo", HostInfo);
	}
}

describe("Project Service Tests", () => {
	describe("project service integration tests", () => {
		let pathToDefaultTemplate: string;
		before(() => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let projectTemplatesService: IProjectTemplatesService = projectIntegrationTest.testInjector.resolve("projectTemplatesService");
			pathToDefaultTemplate = projectTemplatesService.defaultTemplatePath.wait();
		});

		it("creates valid project from default template", () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("project");
			let projectName = "myapp";
			let options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			options.copyFrom = projectIntegrationTest.getNpmPackagePath("tns-template-hello-world").wait();

			projectIntegrationTest.createProject(projectName).wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp").wait();
		});

		it("creates valid project from default template when --template default is specified", () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("project");
			let projectName = "myapp";
			let options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			projectIntegrationTest.createProject(projectName, "default").wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", pathToDefaultTemplate).wait();
		});

		it("creates valid project from default template when --template default@version is specified", () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("project");
			let projectName = "myapp";
			let options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			let projectTemplatesService: IProjectTemplatesService = projectIntegrationTest.testInjector.resolve("projectTemplatesService");
			projectIntegrationTest.createProject(projectName, "default@1.4.0").wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", projectTemplatesService.prepareTemplate("default@1.4.0").wait()).wait();
		});

		it("creates valid project from typescript template", () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectTypescript");
			let projectName = "myapp";
			let options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			projectIntegrationTest.createProject(projectName, "typescript").wait();

			let projectTemplatesService: IProjectTemplatesService = projectIntegrationTest.testInjector.resolve("projectTemplatesService");
			projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", projectTemplatesService.prepareTemplate("typescript").wait()).wait();
		});

		it("creates valid project from tsc template", () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectTsc");
			let projectName = "myapp";
			let options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			projectIntegrationTest.createProject(projectName, "tsc").wait();

			let projectTemplatesService: IProjectTemplatesService = projectIntegrationTest.testInjector.resolve("projectTemplatesService");
			projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", projectTemplatesService.prepareTemplate("tsc").wait()).wait();
		});

		it("creates valid project from local directory template", () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectLocalDir");
			let projectName = "myapp";
			let options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			let tempDir = temp.mkdirSync("template");
			let fs: IFileSystem = projectIntegrationTest.testInjector.resolve("fs");
			fs.writeJson(path.join(tempDir, "package.json"), {
				name: "myCustomTemplate",
				version: "1.0.0",
				dependencies: {
					"lodash": "3.10.1"
				},
				devDependencies: {
					"minimist": "1.2.0"
				}
			}).wait();

			projectIntegrationTest.createProject(projectName, tempDir).wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", tempDir).wait();
		});

		it("creates valid project from tarball", () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectLocalDir");
			let projectName = "myapp";
			let options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			projectIntegrationTest.createProject(projectName, "https://github.com/NativeScript/template-hello-world/tarball/master").wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", pathToDefaultTemplate).wait();
		});

		it("creates valid project from git url", () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectLocalDir");
			let projectName = "myapp";
			let options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			projectIntegrationTest.createProject(projectName, "https://github.com/NativeScript/template-hello-world.git").wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", pathToDefaultTemplate).wait();
		});

		it("creates valid project with specified id from default template", () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("project1");
			let projectName = "myapp";
			let options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			options.copyFrom = projectIntegrationTest.getNpmPackagePath("tns-template-hello-world").wait();
			options.appid = "my.special.id";

			projectIntegrationTest.createProject(projectName).wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, options.appid).wait();
		});
	});
});

function createTestInjector() {
	let testInjector = new yok.Yok();

	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register('logger', stubs.LoggerStub);
	testInjector.register("projectService", ProjectServiceLib.ProjectService);
	testInjector.register("projectHelper", ProjectHelperLib.ProjectHelper);
	testInjector.register("projectTemplatesService", stubs.ProjectTemplatesService);
	testInjector.register("projectNameValidator", mockProjectNameValidator);

	testInjector.register("fs", FileSystem);
	testInjector.register("projectDataService", ProjectDataServiceLib.ProjectDataService);

	testInjector.register("staticConfig", StaticConfig);

	testInjector.register("npmInstallationManager", NpmInstallationManager);
	testInjector.register("httpClient", HttpClientLib.HttpClient);
	testInjector.register("lockfile", stubs.LockFile);

	testInjector.register("childProcess", ChildProcess);

	testInjector.register('projectData', ProjectDataLib.ProjectData);
	testInjector.register("options", Options);
	testInjector.register("hostInfo", HostInfo);

	return testInjector;
}

describe("project upgrade procedure tests", () => {
	it("should throw error when no nativescript project folder specified", () => {
		let testInjector = createTestInjector();
		let tempFolder = temp.mkdirSync("project upgrade");
		let options = testInjector.resolve("options");
		options.path = tempFolder;
		let isErrorThrown = false;

		try {
			testInjector.resolve("projectData"); // This should trigger upgrade procedure
		} catch(err) {
			isErrorThrown = true;
			let expectedErrorMessage = "No project found at or above '%s' and neither was a --path specified.," + tempFolder;
			assert.equal(expectedErrorMessage, err.toString());
		}

		assert.isTrue(isErrorThrown);
	});
	it("should upgrade project when .tnsproject file exists but package.json file doesn't exist", () => {
		let testInjector = createTestInjector();
		let fs: IFileSystem = testInjector.resolve("fs");

		let tempFolder = temp.mkdirSync("projectUpgradeTest2");
		let options = testInjector.resolve("options");
		options.path = tempFolder;
		let tnsProjectData = {
			"id": "org.nativescript.Test",
			"tns-ios": {
				"version": "1.0.0"
			}
		};
		let tnsProjectFilePath = path.join(tempFolder, ".tnsproject");
		fs.writeJson(tnsProjectFilePath, tnsProjectData).wait();

		testInjector.resolve("projectData"); // This should trigger upgrade procedure

		let packageJsonFilePath = path.join(tempFolder, "package.json");
		let packageJsonFileContent = require(packageJsonFilePath);
		assert.isTrue(fs.exists(packageJsonFilePath).wait());
		assert.isFalse(fs.exists(tnsProjectFilePath).wait());
		assert.deepEqual(tnsProjectData, packageJsonFileContent["nativescript"]);
	});
	it("should upgrade project when .tnsproject and package.json exist but nativescript key is not presented in package.json file", () => {
		let testInjector = createTestInjector();
		let fs: IFileSystem = testInjector.resolve("fs");

		let tempFolder = temp.mkdirSync("projectUpgradeTest3");
		let options = testInjector.resolve("options");
		options.path = tempFolder;
		let tnsProjectData = {
			"id": "org.nativescript.Test",
			"tns-ios": {
				"version": "1.0.1"
			}
		};
		let packageJsonData = {
			"name": "testModuleName",
			"version": "0.0.0",
			"dependencies": {
				"myFirstDep": "0.0.1"
			}
		};
		let tnsProjectFilePath = path.join(tempFolder, ".tnsproject");
		fs.writeJson(tnsProjectFilePath, tnsProjectData).wait();

		let packageJsonFilePath = path.join(tempFolder, "package.json");
		fs.writeJson(packageJsonFilePath, packageJsonData).wait();

		testInjector.resolve("projectData"); // This should trigger upgrade procedure

		let packageJsonFileContent = require(packageJsonFilePath);
		let expectedPackageJsonContent: any = packageJsonData;
		expectedPackageJsonContent["nativescript"] = tnsProjectData;
		assert.deepEqual(expectedPackageJsonContent, packageJsonFileContent);
	});
	it("shouldn't upgrade project when .tnsproject and package.json exist and nativescript key is presented in package.json file", () => {
		let testInjector = createTestInjector();
		let fs: IFileSystem = testInjector.resolve("fs");

		let tempFolder = temp.mkdirSync("projectUpgradeTest4");
		let options = testInjector.resolve("options");
		options.path = tempFolder;
		let tnsProjectData = {

		};
		let packageJsonData = {
			"name": "testModuleName",
			"version": "0.0.0",
			"dependencies": {
				"myFirstDep": "0.0.2"
			},
			"nativescript": {
				"id": "org.nativescript.Test",
				"tns-ios": {
					"version": "1.0.2"
				}
			}
		};

		fs.writeJson(path.join(tempFolder, ".tnsproject"), tnsProjectData).wait();
		fs.writeJson(path.join(tempFolder, "package.json"), packageJsonData).wait();
		testInjector.resolve("projectData"); // This should trigger upgrade procedure

		let packageJsonFilePath = path.join(tempFolder, "package.json");
		let packageJsonFileContent = require(packageJsonFilePath);

		assert.deepEqual(packageJsonData, packageJsonFileContent);
	});
});
