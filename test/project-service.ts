import * as yok from "../lib/common/yok";
import * as stubs from "./stubs";
import * as constants from "./../lib/constants";
import { ChildProcess } from "../lib/common/child-process";
import * as ProjectServiceLib from "../lib/services/project-service";
import { ProjectNameService } from "../lib/services/project-name-service";
import * as ProjectDataServiceLib from "../lib/services/project-data-service";
import * as ProjectHelperLib from "../lib/common/project-helper";
import { StaticConfig } from "../lib/config";
import * as NpmLib from "../lib/node-package-manager";
import { NpmInstallationManager } from "../lib/npm-installation-manager";
import * as HttpClientLib from "../lib/common/http-client";
import { FileSystem } from "../lib/common/file-system";
import * as path from "path";
import temp = require("temp");
import helpers = require("../lib/common/helpers");
import { assert } from "chai";
import { Options } from "../lib/options";
import { HostInfo } from "../lib/common/host-info";
import { ProjectTemplatesService } from "../lib/services/project-templates-service";

let mockProjectNameValidator = {
	validate: () => true
};

let dummyString: string = "dummyString";
let hasPromptedForString = false;
let originalIsInteractive = helpers.isInteractive;

temp.track();

class ProjectIntegrationTest {
	public testInjector: IInjector;

	constructor() {
		this.createTestInjector();
	}

	public async createProject(projectOptions: IProjectSettings): Promise<void> {
		let projectService: IProjectService = this.testInjector.resolve("projectService");
		if (!projectOptions.template) {
			projectOptions.template = constants.RESERVED_TEMPLATE_NAMES["default"];
		}
		return projectService.createProject(projectOptions);
	}

	public async assertProject(tempFolder: string, projectName: string, appId: string, projectSourceDirectory: string): Promise<void> {
		let fs: IFileSystem = this.testInjector.resolve("fs");
		let projectDir = path.join(tempFolder, projectName);
		let appDirectoryPath = path.join(projectDir, "app");
		let platformsDirectoryPath = path.join(projectDir, "platforms");
		let tnsProjectFilePath = path.join(projectDir, "package.json");
		let tnsModulesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, constants.TNS_CORE_MODULES_NAME);
		let packageJsonContent = fs.readJson(tnsProjectFilePath);

		assert.isTrue(fs.exists(appDirectoryPath));
		assert.isTrue(fs.exists(platformsDirectoryPath));
		assert.isTrue(fs.exists(tnsProjectFilePath));
		assert.isTrue(fs.exists(tnsModulesPath));

		assert.isFalse(fs.isEmptyDir(appDirectoryPath));
		assert.isTrue(fs.isEmptyDir(platformsDirectoryPath));

		let actualAppId = packageJsonContent["nativescript"].id;
		let expectedAppId = appId;
		assert.equal(actualAppId, expectedAppId);

		let tnsCoreModulesRecord = packageJsonContent["dependencies"][constants.TNS_CORE_MODULES_NAME];
		assert.isTrue(tnsCoreModulesRecord !== null);

		let sourceDir = projectSourceDirectory;

		// Hidden files (starting with dots ".") are not copied.
		let expectedFiles = fs.enumerateFilesInDirectorySync(sourceDir, (file, stat) => stat.isDirectory() || !_.startsWith(path.basename(file), "."));
		let actualFiles = fs.enumerateFilesInDirectorySync(appDirectoryPath);

		assert.isTrue(actualFiles.length >= expectedFiles.length, "Files in created project must be at least as files in app dir.");

		_.each(expectedFiles, file => {
			let relativeToProjectDir = helpers.getRelativeToRootPath(sourceDir, file);
			let filePathInApp = path.join(appDirectoryPath, relativeToProjectDir);
			assert.isTrue(fs.exists(filePathInApp), `File ${filePathInApp} does not exist.`);
		});

		// assert dependencies and devDependencies are copied from template to real project
		let sourcePackageJsonContent = fs.readJson(path.join(sourceDir, "package.json"));
		let missingDeps = _.difference(_.keys(sourcePackageJsonContent.dependencies), _.keys(packageJsonContent.dependencies));
		let missingDevDeps = _.difference(_.keys(sourcePackageJsonContent.devDependencies), _.keys(packageJsonContent.devDependencies));
		assert.deepEqual(missingDeps, [], `All dependencies from template must be copied to project's package.json. Missing ones are: ${missingDeps.join(", ")}.`);
		assert.deepEqual(missingDevDeps, [], `All devDependencies from template must be copied to project's package.json. Missing ones are: ${missingDevDeps.join(", ")}.`);

		// assert App_Resources are prepared correctly
		let appResourcesDir = path.join(appDirectoryPath, "App_Resources");
		let appResourcesContents = fs.readDirectory(appResourcesDir);
		assert.deepEqual(appResourcesContents, ["Android", "iOS"], "Project's app/App_Resources must contain Android and iOS directories.");
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
		this.testInjector.register("projectNameService", ProjectNameService);
		this.testInjector.register("projectHelper", ProjectHelperLib.ProjectHelper);
		this.testInjector.register("projectTemplatesService", ProjectTemplatesService);
		this.testInjector.register("projectNameValidator", mockProjectNameValidator);
		this.testInjector.register("projectData", {});

		this.testInjector.register("fs", FileSystem);
		this.testInjector.register("projectDataService", ProjectDataServiceLib.ProjectDataService);
		this.testInjector.register("staticConfig", StaticConfig);
		this.testInjector.register("analyticsService", { track: async (): Promise<any> => undefined });

		this.testInjector.register("npmInstallationManager", NpmInstallationManager);
		this.testInjector.register("npm", NpmLib.NodePackageManager);
		this.testInjector.register("httpClient", HttpClientLib.HttpClient);
		this.testInjector.register("lockfile", stubs.LockFile);

		this.testInjector.register("options", Options);
		this.testInjector.register("hostInfo", HostInfo);
		this.testInjector.register("prompter", {
			confirm: async (message: string): Promise<boolean> => true,
			getString: async (message: string): Promise<string> => {
				hasPromptedForString = true;
				return dummyString;
			}
		});
		this.testInjector.register("npmInstallationManager", NpmInstallationManager);
	}
}

describe("Project Service Tests", () => {
	describe("project service integration tests", () => {
		let defaultTemplatePath: string;
		let defaultSpecificVersionTemplatePath: string;
		let noAppResourcesTemplatePath: string;
		let angularTemplatePath: string;
		let typescriptTemplatePath: string;

		const noAppResourcesTemplateName = "tns-template-hello-world-ts";

		before(async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let fs: IFileSystem = projectIntegrationTest.testInjector.resolve("fs");
			let npmInstallationManager: INpmInstallationManager = projectIntegrationTest.testInjector.resolve("npmInstallationManager");

			let defaultTemplateDir = temp.mkdirSync("defaultTemplate");
			fs.writeJson(path.join(defaultTemplateDir, "package.json"), {
				"name": "defaultTemplate",
				"version": "1.0.0",
				"description": "dummy",
				"license": "MIT",
				"readme": "dummy",
				"repository": "dummy"
			});

			await npmInstallationManager.install(constants.RESERVED_TEMPLATE_NAMES["default"], defaultTemplateDir, { dependencyType: "save" });
			defaultTemplatePath = path.join(defaultTemplateDir, "node_modules", constants.RESERVED_TEMPLATE_NAMES["default"]);

			fs.deleteDirectory(path.join(defaultTemplatePath, "node_modules"));

			let defaultSpecificVersionTemplateDir = temp.mkdirSync("defaultTemplateSpeciffic");
			fs.writeJson(path.join(defaultSpecificVersionTemplateDir, "package.json"), {
				"name": "defaultTemplateSpecialVersion",
				"version": "1.0.0",
				"description": "dummy",
				"license": "MIT",
				"readme": "dummy",
				"repository": "dummy"
			});

			await npmInstallationManager.install(constants.RESERVED_TEMPLATE_NAMES["default"], defaultSpecificVersionTemplateDir, { version: "1.4.0", dependencyType: "save" });
			defaultSpecificVersionTemplatePath = path.join(defaultSpecificVersionTemplateDir, "node_modules", constants.RESERVED_TEMPLATE_NAMES["default"]);

			fs.deleteDirectory(path.join(defaultSpecificVersionTemplatePath, "node_modules"));

			let angularTemplateDir = temp.mkdirSync("angularTemplate");
			fs.writeJson(path.join(angularTemplateDir, "package.json"), {
				"name": "angularTemplate",
				"version": "1.0.0",
				"description": "dummy",
				"license": "MIT",
				"readme": "dummy",
				"repository": "dummy"
			});

			await npmInstallationManager.install(constants.RESERVED_TEMPLATE_NAMES["angular"], angularTemplateDir, { dependencyType: "save" });
			angularTemplatePath = path.join(angularTemplateDir, "node_modules", constants.RESERVED_TEMPLATE_NAMES["angular"]);

			fs.deleteDirectory(path.join(angularTemplatePath, "node_modules"));

			let typescriptTemplateDir = temp.mkdirSync("typescriptTemplate");
			fs.writeJson(path.join(typescriptTemplateDir, "package.json"), {
				"name": "typescriptTemplate",
				"version": "1.0.0",
				"description": "dummy",
				"license": "MIT",
				"readme": "dummy",
				"repository": "dummy"
			});

			await npmInstallationManager.install(constants.RESERVED_TEMPLATE_NAMES["typescript"], typescriptTemplateDir, { dependencyType: "save" });
			typescriptTemplatePath = path.join(typescriptTemplateDir, "node_modules", constants.RESERVED_TEMPLATE_NAMES["typescript"]);

			fs.deleteDirectory(path.join(typescriptTemplatePath, "node_modules"));
			let noAppResourcesTemplateDir = temp.mkdirSync("noAppResources");
			fs.writeJson(path.join(noAppResourcesTemplateDir, "package.json"), {
				"name": "blankTemplate",
				"version": "1.0.0",
				"description": "dummy",
				"license": "MIT",
				"readme": "dummy",
				"repository": "dummy"
			});

			await npmInstallationManager.install(noAppResourcesTemplateName, noAppResourcesTemplateDir, {
				dependencyType: "save",
				version: "2.0.0"
			});
			noAppResourcesTemplatePath = path.join(noAppResourcesTemplateDir, "node_modules", noAppResourcesTemplateName);

			fs.deleteDirectory(path.join(noAppResourcesTemplatePath, "node_modules"));
		});

		it("creates valid project from default template", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("project");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({ projectName: projectName, pathToProject: tempFolder });
			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", defaultTemplatePath);
		});

		it("creates valid project from default template when --template default is specified", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("project");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({ projectName: projectName, template: "default", pathToProject: tempFolder });
			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", defaultTemplatePath);
		});

		it("creates valid project from default template when --template default@version is specified", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("project");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({ projectName: projectName, template: "default@1.4.0", pathToProject: tempFolder });
			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", defaultSpecificVersionTemplatePath);
		});

		it("creates valid project from a template without App_Resources", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("project");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({ projectName: projectName, template: noAppResourcesTemplateName + "@2.0.0", pathToProject: tempFolder });
			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", noAppResourcesTemplatePath);
		});

		it("creates valid project from typescript template", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectTypescript");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({ projectName: projectName, template: "typescript", pathToProject: tempFolder });

			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", typescriptTemplatePath);
		});

		it("creates valid project from tsc template", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectTsc");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({ projectName: projectName, template: "tsc", pathToProject: tempFolder });
			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", typescriptTemplatePath);
		});

		it("creates valid project from angular template", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectAngular");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({ projectName: projectName, template: "angular", pathToProject: tempFolder });

			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", angularTemplatePath);
		});

		it("creates valid project from ng template", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectNg");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({ projectName: projectName, template: "ng", pathToProject: tempFolder });

			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", angularTemplatePath);
		});

		it("creates valid project from local directory template", async () => {
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
				},
				"description": "dummy",
				"license": "MIT",
				"readme": "dummy",
				"repository": "dummy"
			});

			fs.createDirectory(path.join(tempDir, "App_Resources", "Android")); //copy App_Resources from somewhere
			fs.createDirectory(path.join(tempDir, "App_Resources", "iOS"));
			// `npm i <path-to-local-dir>` does not copy empty dirs, so the package installed in node_modules will not have App_Resources/Android and App_Resources/iOS dir.
			fs.writeFile(path.join(tempDir, "App_Resources", "Android", "some-resource"), null);
			fs.writeFile(path.join(tempDir, "App_Resources", "iOS", "some-resource"), null);

			await projectIntegrationTest.createProject({ projectName: projectName, template: tempDir, pathToProject: tempFolder });
			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", tempDir);
		});

		it("creates valid project from tarball", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectLocalDir");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({
				projectName: projectName,
				template: "https://github.com/NativeScript/template-hello-world/tarball/master",
				pathToProject: tempFolder
			});

			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", defaultTemplatePath);
		});

		it("creates valid project from git url", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("projectLocalDir");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({
				projectName: projectName,
				template: "https://github.com/NativeScript/template-hello-world.git",
				pathToProject: tempFolder
			});

			await projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp", defaultTemplatePath);
		});

		it("creates valid project with specified id from default template", async () => {
			let projectIntegrationTest = new ProjectIntegrationTest();
			let tempFolder = temp.mkdirSync("project1");
			let projectName = "myapp";

			await projectIntegrationTest.createProject({ projectName: projectName, pathToProject: tempFolder, appId: "my.special.id" });
			await projectIntegrationTest.assertProject(tempFolder, projectName, "my.special.id", defaultTemplatePath);
		});

		describe("project name validation tests", () => {
			let validProjectName = "valid";
			let invalidProjectName = "1invalid";
			let projectIntegrationTest: ProjectIntegrationTest;
			let tempFolder: string;
			let options: IOptions;
			let prompter: IPrompter;

			beforeEach(() => {
				hasPromptedForString = false;
				helpers.isInteractive = () => true;
				projectIntegrationTest = new ProjectIntegrationTest();
				tempFolder = temp.mkdirSync("project");
				options = projectIntegrationTest.testInjector.resolve("options");
				prompter = projectIntegrationTest.testInjector.resolve("prompter");
			});

			afterEach(() => {
				helpers.isInteractive = originalIsInteractive;
			});

			it("creates project when is interactive and incorrect name is specified and the --force option is set", async () => {
				let projectName = invalidProjectName;
				await projectIntegrationTest.createProject({ projectName: projectName, pathToProject: tempFolder, force: true });
				await projectIntegrationTest.assertProject(tempFolder, projectName, `org.nativescript.${projectName}`, defaultTemplatePath);
			});

			it("creates project when is interactive and incorrect name is specified and the user confirms to use the incorrect name", async () => {
				let projectName = invalidProjectName;
				prompter.confirm = (message: string): Promise<boolean> => Promise.resolve(true);

				await projectIntegrationTest.createProject({ projectName: projectName, pathToProject: tempFolder });
				await projectIntegrationTest.assertProject(tempFolder, projectName, `org.nativescript.${projectName}`, defaultTemplatePath);
			});

			it("prompts for new name when is interactive and incorrect name is specified and the user does not confirm to use the incorrect name", async () => {
				let projectName = invalidProjectName;

				prompter.confirm = (message: string): Promise<boolean> => Promise.resolve(false);

				await projectIntegrationTest.createProject({ projectName: projectName, pathToProject: tempFolder });
				assert.isTrue(hasPromptedForString);
			});

			it("creates project when is interactive and incorrect name s specified and the user does not confirm to use the incorrect name and enters incorrect name again several times and then enters correct name", async () => {
				let projectName = invalidProjectName;

				prompter.confirm = (message: string): Promise<boolean> => Promise.resolve(false);

				let incorrectInputsLimit = 5;
				let incorrectInputsCount = 0;

				prompter.getString = async (message: string): Promise<string> => {
					if (incorrectInputsCount < incorrectInputsLimit) {
						incorrectInputsCount++;
					} else {
						hasPromptedForString = true;

						return validProjectName;
					}

					return projectName;
				};

				await projectIntegrationTest.createProject({ projectName: projectName, pathToProject: tempFolder });
				assert.isTrue(hasPromptedForString);
			});

			it("does not create project when is not interactive and incorrect name is specified", async () => {
				let projectName = invalidProjectName;
				helpers.isInteractive = () => false;

				await assert.isRejected(projectIntegrationTest.createProject({ projectName: projectName, pathToProject: tempFolder, force: false }));
			});

			it("creates project when is not interactive and incorrect name is specified and the --force option is set", async () => {
				let projectName = invalidProjectName;
				helpers.isInteractive = () => false;

				await projectIntegrationTest.createProject({ projectName: projectName, pathToProject: tempFolder, force: true });

				await projectIntegrationTest.assertProject(tempFolder, projectName, `org.nativescript.${projectName}`, defaultTemplatePath);
			});
		});

	});

	describe("isValidNativeScriptProject", () => {
		const getTestInjector = (): IInjector => {
			const testInjector = new yok.Yok();
			testInjector.register("npm", {});
			testInjector.register("errors", {});
			testInjector.register("fs", {});
			testInjector.register("logger", {});
			testInjector.register("projectDataService", {});
			testInjector.register("projectNameService", {});
			testInjector.register("projectTemplatesService", {});
			testInjector.register("staticConfig", {});
			testInjector.register("projectHelper", {});
			testInjector.register("npmInstallationManager", {});

			return testInjector;
		};

		it("returns true when initialize project data does not throw, projectDir and projectId are valid", () => {
			const testInjector = getTestInjector();
			testInjector.register("projectData", {
				projectDir: "projectDir",
				projectId: "projectId",
				initializeProjectData: (): void => undefined
			});

			const projectService: IProjectService = testInjector.resolve(ProjectServiceLib.ProjectService);
			assert.isTrue(projectService.isValidNativeScriptProject("some-dir"));
		});

		it("returns false when initialize project data throws", () => {
			const testInjector = getTestInjector();
			testInjector.register("projectData", {
				initializeProjectData: (): void => { throw new Error("err"); }
			});

			const projectService: IProjectService = testInjector.resolve(ProjectServiceLib.ProjectService);
			assert.isFalse(projectService.isValidNativeScriptProject("some-dir"));
		});

		it("returns false when initializeProjectData does not throw, but there's no projectDir set", () => {
			const testInjector = getTestInjector();
			testInjector.register("projectData", {
				projectId: "projectId",
				initializeProjectData: (): void => undefined
			});

			const projectService: IProjectService = testInjector.resolve(ProjectServiceLib.ProjectService);
			assert.isFalse(projectService.isValidNativeScriptProject("some-dir"));
		});

		it("returns false when initializeProjectData does not throw, but there's no projectId set", () => {
			const testInjector = getTestInjector();
			testInjector.register("projectData", {
				projectDir: "projectDir",
				initializeProjectData: (): void => undefined
			});

			const projectService: IProjectService = testInjector.resolve(ProjectServiceLib.ProjectService);
			assert.isFalse(projectService.isValidNativeScriptProject("some-dir"));
		});
	});
});
