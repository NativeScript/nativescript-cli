import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { ProjectTemplatesService } from "../lib/services/project-templates-service";
import { assert } from "chai";
import * as path from "path";
import * as constants from "../lib/constants";

let isDeleteDirectoryCalledForNodeModulesDir = false;
const nativeScriptValidatedTemplatePath = "nsValidatedTemplatePath";

function createTestInjector(configuration?: { shouldNpmInstallThrow: boolean, npmInstallationDirContents: string[], npmInstallationDirNodeModulesContents: string[] }): IInjector {
	const injector = new Yok();
	injector.register("errors", stubs.ErrorsStub);
	injector.register("logger", stubs.LoggerStub);
	injector.register("fs", {
		readDirectory: (dirPath: string): string[] => {
			if (dirPath.toLowerCase().indexOf("node_modules") !== -1) {
				return configuration.npmInstallationDirNodeModulesContents;
			}
			return configuration.npmInstallationDirContents;
		},

		deleteDirectory: (directory: string) => {
			if (directory.indexOf("node_modules") !== -1) {
				isDeleteDirectoryCalledForNodeModulesDir = true;
			}
		},

		exists: (filePath: string): boolean => false

	});

	injector.register("npm", {
		install: (packageName: string, pathToSave: string, config?: any) => {
			if (configuration.shouldNpmInstallThrow) {
				throw new Error("NPM install throws error.");
			}

			return "sample result";
		}
	});

	injector.register("npmInstallationManager", {
		install: (packageName: string, options?: INpmInstallOptions) => {
			if (configuration.shouldNpmInstallThrow) {
				throw new Error("NPM install throws error.");
			}

			return Promise.resolve(nativeScriptValidatedTemplatePath);
		}
	});

	injector.register("projectTemplatesService", ProjectTemplatesService);

	injector.register("analyticsService", {
		track: async (): Promise<any[]> => undefined,
		trackEventActionInGoogleAnalytics: (data: IEventActionData) => Promise.resolve()
	});

	return injector;
}

describe("project-templates-service", () => {
	let testInjector: IInjector;
	let projectTemplatesService: IProjectTemplatesService;
	beforeEach(() => {
		isDeleteDirectoryCalledForNodeModulesDir = false;
	});

	describe("prepareTemplate", () => {
		describe("throws error", () => {
			it("when npm install fails", async () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: true, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: null });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				await assert.isRejected(projectTemplatesService.prepareTemplate("invalidName", "tempFolder"));
			});
		});

		describe("returns correct path to template", () => {
			it("when reserved template name is used", async () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: [] });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				const actualPathToTemplate = await projectTemplatesService.prepareTemplate("typescript", "tempFolder");
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("when reserved template name is used (case-insensitive test)", async () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: [] });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				const actualPathToTemplate = await projectTemplatesService.prepareTemplate("tYpEsCriPT", "tempFolder");
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("uses defaultTemplate when undefined is passed as parameter", async () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: [] });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				const actualPathToTemplate = await projectTemplatesService.prepareTemplate(constants.RESERVED_TEMPLATE_NAMES["default"], "tempFolder");
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});
		});

		describe("sends correct information to Google Analytics", () => {
			let analyticsService: IAnalyticsService;
			let dataSentToGoogleAnalytics: IEventActionData;
			beforeEach(() => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: [] });
				analyticsService = testInjector.resolve<IAnalyticsService>("analyticsService");
				dataSentToGoogleAnalytics = null;
				analyticsService.trackEventActionInGoogleAnalytics = async (data: IEventActionData): Promise<void> => {
					dataSentToGoogleAnalytics = data;
				};
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
			});

			it("sends template name when the template is used from npm", async () => {
				const templateName = "template-from-npm";
				await projectTemplatesService.prepareTemplate(templateName, "tempFolder");
				assert.deepEqual(dataSentToGoogleAnalytics, {
					action: constants.TrackActionNames.CreateProject,
					isForDevice: null,
					additionalData: templateName
				});
			});

			it("sends template name (from template's package.json) when the template is used from local path", async () => {
				const templateName = "my-own-local-template";
				const localTemplatePath = "/Users/username/localtemplate";
				const fs = testInjector.resolve<IFileSystem>("fs");
				fs.exists = (path: string): boolean => true;
				fs.readJson = (filename: string, encoding?: string): any => ({ name: templateName });
				await projectTemplatesService.prepareTemplate(localTemplatePath, "tempFolder");
				assert.deepEqual(dataSentToGoogleAnalytics, {
					action: constants.TrackActionNames.CreateProject,
					isForDevice: null,
					additionalData: `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateName}`
				});
			});

			it("sends the template name (path to dirname) when the template is used from local path but there's no package.json at the root", async () => {
				const templateName = "localtemplate";
				const localTemplatePath = `/Users/username/${templateName}`;
				const fs = testInjector.resolve<IFileSystem>("fs");
				fs.exists = (localPath: string): boolean => path.basename(localPath) !== constants.PACKAGE_JSON_FILE_NAME;
				await projectTemplatesService.prepareTemplate(localTemplatePath, "tempFolder");
				assert.deepEqual(dataSentToGoogleAnalytics, {
					action: constants.TrackActionNames.CreateProject,
					isForDevice: null,
					additionalData: `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateName}`
				});
			});

			it("does not send anything when trying to get template name fails", async () => {
				const templateName = "localtemplate";
				const localTemplatePath = `/Users/username/${templateName}`;
				const fs = testInjector.resolve<IFileSystem>("fs");
				fs.exists = (localPath: string): boolean => true;
				fs.readJson = (filename: string, encoding?: string): any => {
					throw new Error("Unable to read json");
				};

				await projectTemplatesService.prepareTemplate(localTemplatePath, "tempFolder");

				assert.deepEqual(dataSentToGoogleAnalytics, null);
			});
		});
	});
});
