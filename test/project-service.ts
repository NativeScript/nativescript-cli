import * as yok from "../lib/common/yok";
import * as constants from "../lib/constants";
import * as ProjectServiceLib from "../lib/services/project-service";
import { assert } from "chai";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
import { ErrorsStub, LoggerStub, TempServiceStub } from "./stubs";
import * as path from "path";
import {
	IProjectData,
	IProjectDataService,
	IProjectService,
} from "../lib/definitions/project";
import { IOptions, IProjectNameService } from "../lib/declarations";
import { IInjector } from "../lib/common/definitions/yok";
import { IDictionary, IFileSystem } from "../lib/common/declarations";
import { ProjectConfigService } from "../lib/services/project-config-service";
import { Options } from "../lib/options";

describe("projectService", () => {
	describe("createProject", () => {
		const invalidProjectName = "1invalid";
		const dirToCreateProject: string = path.resolve("projectDir");

		/* tslint:disable:no-empty */
		const getTestInjector = (opts: { projectName: string }): IInjector => {
			const testInjector = new yok.Yok();
			testInjector.register("packageManager", {
				install: async () => {},
			});
			testInjector.register("errors", ErrorsStub);
			testInjector.register("fs", {
				exists: () => true,
				isEmptyDir: () => true,
				isRelativePath: () => true,
				createDirectory: () => {},
				writeJson: () => {},
				deleteDirectory: () => {},
				ensureDirectoryExists: () => {},
				readJson: () => ({}),
				readText: (value?: string) => "",
				writeFile: (value?: string) => {},
			});
			testInjector.register("options", Options);
			testInjector.register("logger", LoggerStub);
			testInjector.register("projectDataService", {
				getProjectData: (projectDir?: string): IProjectData =>
					<any>{
						getAppResourcesDirectoryPath: () => "appResourcesDirectoryPath",
					},
				setNSValue: () => {},
			});
			testInjector.register("projectData", {});
			testInjector.register("projectNameService", {
				ensureValidName: async () => opts.projectName,
			});
			testInjector.register("projectConfigService", ProjectConfigService);
			testInjector.register("cleanupService", {});
			testInjector.register("projectTemplatesService", {
				prepareTemplate: async () => ({
					templateName: constants.RESERVED_TEMPLATE_NAMES["default"],
					templatePath: "some path",
					templateVersion: "v2",
					templatePackageJsonContent: {
						dependencies: {
							["tns-core-modules"]: "1.0.0",
						},
					},
					version: "1.0.0",
				}),
			});
			testInjector.register("staticConfig", {
				PROJECT_FILE_NAME: "package.json",
			});
			testInjector.register("projectHelper", {
				generateDefaultAppId: () => `org.nativescript.${opts.projectName}`,
			});
			testInjector.register("packageInstallationManager", {});
			testInjector.register("settingsService", SettingsService);
			testInjector.register("hooksService", {
				executeAfterHooks: async (
					commandName: string,
					hookArguments?: IDictionary<any>
				): Promise<void> => undefined,
			});
			testInjector.register("pacoteService", {
				manifest: () => Promise.resolve(),
				downloadAndExtract: () => Promise.resolve(),
				extractPackage: () => Promise.resolve(),
			});
			testInjector.register("tempService", TempServiceStub);
			const executedCommands: string[] = [];
			testInjector.register("childProcess", {
				_getExecutedCommands: () => executedCommands,
				exec: (executedCommand: string) => {
					executedCommands.push(executedCommand);
				},
			});

			return testInjector;
		};
		/* tslint:enable:no-empty */

		it("creates project with invalid name when projectNameService does not fail", async () => {
			const projectName = invalidProjectName;
			const testInjector = getTestInjector({ projectName });
			const projectService = testInjector.resolve<IProjectService>(
				ProjectServiceLib.ProjectService
			);
			const projectDir = path.join(dirToCreateProject, projectName);
			const projectCreationData = await projectService.createProject({
				projectName: projectName,
				pathToProject: dirToCreateProject,
				force: true,
				template: constants.RESERVED_TEMPLATE_NAMES["default"],
			});

			assert.deepStrictEqual(projectCreationData, {
				projectName,
				projectDir,
			});
		});

		it("creates a git repo", async () => {
			const projectName = invalidProjectName;
			const testInjector = getTestInjector({ projectName });
			const options = testInjector.resolve<IOptions>("options");
			const projectService = testInjector.resolve<IProjectService>(
				ProjectServiceLib.ProjectService
			);
			const projectDir = path.join(dirToCreateProject, projectName);

			// force creation to skip git repo check...
			options.force = true;

			await projectService.createProject({
				projectName: projectName,
				pathToProject: dirToCreateProject,
				force: true,
				template: constants.RESERVED_TEMPLATE_NAMES["default"],
			});

			assert.deepEqual(
				testInjector.resolve("childProcess")._getExecutedCommands(),
				[
					`git init ${projectDir}`,
					`git -C ${projectDir} add --all`,
					`git -C ${projectDir} commit --no-verify -m "init"`,
				]
			);
		});

		it("does not create a git repo with --no-git", async () => {
			const projectName = invalidProjectName;
			const testInjector = getTestInjector({ projectName });
			const options = testInjector.resolve<IOptions>("options");
			const projectService = testInjector.resolve<IProjectService>(
				ProjectServiceLib.ProjectService
			);

			// simulate --no-git
			options.git = false;

			await projectService.createProject({
				projectName: projectName,
				pathToProject: dirToCreateProject,
				force: true,
				template: constants.RESERVED_TEMPLATE_NAMES["default"],
			});

			assert.deepEqual(
				testInjector.resolve("childProcess")._getExecutedCommands(),
				[]
			);
		});

		it("fails when invalid name is passed when projectNameService fails", async () => {
			const projectName = invalidProjectName;
			const testInjector = getTestInjector({ projectName });
			const projectNameService = testInjector.resolve<IProjectNameService>(
				"projectNameService"
			);
			const err = new Error("Invalid name");
			projectNameService.ensureValidName = (name: string) => {
				throw err;
			};
			const projectService = testInjector.resolve<IProjectService>(
				ProjectServiceLib.ProjectService
			);
			await assert.isRejected(
				projectService.createProject({
					projectName: projectName,
					pathToProject: dirToCreateProject,
					template: constants.RESERVED_TEMPLATE_NAMES["default"],
				}),
				err.message
			);
		});

		it("fails when project directory is not empty", async () => {
			const projectName = invalidProjectName;
			const testInjector = getTestInjector({ projectName });
			const fs = testInjector.resolve<IFileSystem>("fs");
			fs.isEmptyDir = (name: string) => false;
			const projectService = testInjector.resolve<IProjectService>(
				ProjectServiceLib.ProjectService
			);
			await assert.isRejected(
				projectService.createProject({
					projectName: projectName,
					pathToProject: dirToCreateProject,
					template: constants.RESERVED_TEMPLATE_NAMES["default"],
				}),
				`Path already exists and is not empty ${path.join(
					dirToCreateProject,
					projectName
				)}`
			);
		});
	});

	describe("isValidNativeScriptProject", () => {
		const getTestInjector = (projectData?: any): IInjector => {
			const testInjector = new yok.Yok();
			testInjector.register("packageManager", {});
			testInjector.register("errors", {});
			testInjector.register("fs", {
				readText: (value?: string) => "",
			});
			testInjector.register("logger", {});
			testInjector.register("options", Options);
			testInjector.register("projectDataService", {
				getProjectData: (projectDir?: string): IProjectData => projectData,
			});
			testInjector.register("projectData", {});
			testInjector.register("projectNameService", {});
			testInjector.register("projectConfigService", ProjectConfigService);
			testInjector.register("cleanupService", {});
			testInjector.register("projectTemplatesService", {});
			testInjector.register("staticConfig", {});
			testInjector.register("projectHelper", {});
			testInjector.register("packageInstallationManager", {});
			testInjector.register("settingsService", SettingsService);
			testInjector.register("hooksService", {
				executeAfterHooks: async (
					commandName: string,
					hookArguments?: IDictionary<any>
				): Promise<void> => undefined,
			});
			testInjector.register("pacoteService", {
				manifest: () => Promise.resolve(),
				downloadAndExtract: () => Promise.resolve(),
			});
			testInjector.register("tempService", TempServiceStub);
			testInjector.register("childProcess", {});

			return testInjector;
		};

		it("returns true when getProjectData does not throw, projectDir and projectId are valid", () => {
			const testInjector = getTestInjector({
				projectDir: "projectDir",
				projectId: "projectId",
				projectIdentifiers: { android: "projectId", ios: "projectId" },
			});

			const projectService: IProjectService = testInjector.resolve(
				ProjectServiceLib.ProjectService
			);
			assert.isTrue(projectService.isValidNativeScriptProject("some-dir"));
		});

		it("returns correct data when multiple calls are executed", () => {
			const testInjector = getTestInjector();
			const projectDataService = testInjector.resolve<IProjectDataService>(
				"projectDataService"
			);
			const projectData: any = {
				projectDir: "projectDir",
				projectId: "projectId",
				projectIdentifiers: { android: "projectId", ios: "projectId" },
			};

			let returnedProjectData: any = null;
			projectDataService.getProjectData = (
				projectDir?: string
			): IProjectData => {
				projectData.projectDir = projectDir;
				returnedProjectData = projectData;
				return returnedProjectData;
			};

			const projectService: IProjectService = testInjector.resolve(
				ProjectServiceLib.ProjectService
			);
			assert.isTrue(projectService.isValidNativeScriptProject("some-dir"));
			assert.equal(returnedProjectData.projectDir, "some-dir");
			assert.isTrue(projectService.isValidNativeScriptProject("some-dir-2"));
			assert.equal(returnedProjectData.projectDir, "some-dir-2");

			projectDataService.getProjectData = (
				projectDir?: string
			): IProjectData => {
				throw new Error("Err");
			};

			assert.isFalse(projectService.isValidNativeScriptProject("some-dir-2"));
		});

		it("returns false when getProjectData throws", () => {
			const testInjector = getTestInjector(null);
			testInjector.register("projectDataService", {
				getProjectData: (): void => {
					throw new Error("err");
				},
			});

			const projectService: IProjectService = testInjector.resolve(
				ProjectServiceLib.ProjectService
			);
			assert.isFalse(projectService.isValidNativeScriptProject("some-dir"));
		});

		it("returns false when getProjectData does not throw, but there's no projectDir set", () => {
			const testInjector = getTestInjector({
				projectId: "projectId",
			});

			const projectService: IProjectService = testInjector.resolve(
				ProjectServiceLib.ProjectService
			);
			assert.isFalse(projectService.isValidNativeScriptProject("some-dir"));
		});

		it("returns false when getProjectData does not throw, but there's no projectId set", () => {
			const testInjector = getTestInjector({
				projectDir: "projectDir",
			});

			const projectService: IProjectService = testInjector.resolve(
				ProjectServiceLib.ProjectService
			);
			assert.isFalse(projectService.isValidNativeScriptProject("some-dir"));
		});
	});
});
