import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { ProjectTemplatesService } from "../lib/services/project-templates-service";
import { assert } from "chai";
import * as path from "path";
import * as constants from "../lib/constants";
import { format } from "util";

let isDeleteDirectoryCalledForNodeModulesDir = false;
const nativeScriptValidatedTemplatePath = "nsValidatedTemplatePath";

function createTestInjector(configuration: { shouldNpmInstallThrow?: boolean, packageJsonContent?: any } = {}): IInjector {
	const injector = new Yok();
	injector.register("errors", stubs.ErrorsStub);
	injector.register("logger", stubs.LoggerStub);
	injector.register("fs", {
		exists: (pathToCheck: string) => true,

		readJson: (pathToFile: string) => configuration.packageJsonContent || {},

		deleteDirectory: (directory: string) => {
			if (directory.indexOf("node_modules") !== -1) {
				isDeleteDirectoryCalledForNodeModulesDir = true;
			}
		}
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

	injector.register("pacoteService", {
		manifest: (packageName: string) => {
			const packageJsonContent = configuration.packageJsonContent || {};
			packageJsonContent.name = packageName;
			return Promise.resolve(packageJsonContent);
		}
	});

	return injector;
}

describe("project-templates-service", () => {
	beforeEach(() => {
		isDeleteDirectoryCalledForNodeModulesDir = false;
	});

	describe("prepareTemplate", () => {
		describe("throws error", () => {
			it("when npm install fails", async () => {
				const testInjector = createTestInjector({ shouldNpmInstallThrow: true });
				const projectTemplatesService = testInjector.resolve<IProjectTemplatesService>("projectTemplatesService");
				await assert.isRejected(projectTemplatesService.prepareTemplate("invalidName", "tempFolder"));
			});
		});

		describe("returns correct path to template", () => {
			it("when reserved template name is used", async () => {
				const testInjector = createTestInjector();
				const projectTemplatesService = testInjector.resolve<IProjectTemplatesService>("projectTemplatesService");
				const { templatePath } = await projectTemplatesService.prepareTemplate("typescript", "tempFolder");
				assert.strictEqual(path.basename(templatePath), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("when reserved template name is used (case-insensitive test)", async () => {
				const testInjector = createTestInjector();
				const projectTemplatesService = testInjector.resolve<IProjectTemplatesService>("projectTemplatesService");
				const { templatePath } = await projectTemplatesService.prepareTemplate("tYpEsCriPT", "tempFolder");
				assert.strictEqual(path.basename(templatePath), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("uses defaultTemplate when undefined is passed as parameter", async () => {
				const testInjector = createTestInjector();
				const projectTemplatesService = testInjector.resolve<IProjectTemplatesService>("projectTemplatesService");
				const { templatePath } = await projectTemplatesService.prepareTemplate(constants.RESERVED_TEMPLATE_NAMES["default"], "tempFolder");
				assert.strictEqual(path.basename(templatePath), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});
		});

		describe("sends correct information to Google Analytics", () => {
			let analyticsService: IAnalyticsService;
			let dataSentToGoogleAnalytics: IEventActionData[] = [];
			let testInjector: IInjector;
			let projectTemplatesService: IProjectTemplatesService;

			beforeEach(() => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false });
				analyticsService = testInjector.resolve<IAnalyticsService>("analyticsService");
				const fs = testInjector.resolve<IFileSystem>("fs");
				fs.exists = (filePath: string) => false;
				dataSentToGoogleAnalytics = [];
				analyticsService.trackEventActionInGoogleAnalytics = async (data: IEventActionData): Promise<void> => {
					dataSentToGoogleAnalytics.push(data);
				};
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
			});

			it("sends template name when the template is used from npm", async () => {
				const templateName = "template-from-npm";
				await projectTemplatesService.prepareTemplate(templateName, "tempFolder");
				assert.deepEqual(dataSentToGoogleAnalytics, [
					{
						action: constants.TrackActionNames.CreateProject,
						isForDevice: null,
						additionalData: templateName
					},
					{
						action: constants.TrackActionNames.UsingTemplate,
						additionalData: `${templateName}${constants.AnalyticsEventLabelDelimiter}${constants.TemplateVersions.v1}`
					}
				]);
			});

			it("sends template name (from template's package.json) when the template is used from local path", async () => {
				const templateName = "my-own-local-template";
				const localTemplatePath = "/Users/username/localtemplate";
				const fs = testInjector.resolve<IFileSystem>("fs");
				fs.exists = (path: string): boolean => true;
				const pacoteService = testInjector.resolve<IPacoteService>("pacoteService");
				pacoteService.manifest = () => Promise.resolve({ name: templateName });
				await projectTemplatesService.prepareTemplate(localTemplatePath, "tempFolder");
				assert.deepEqual(dataSentToGoogleAnalytics, [
					{
						action: constants.TrackActionNames.CreateProject,
						isForDevice: null,
						additionalData: `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateName}`
					},
					{
						action: constants.TrackActionNames.UsingTemplate,
						additionalData: `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateName}${constants.AnalyticsEventLabelDelimiter}${constants.TemplateVersions.v1}`
					}
				]);
			});

			it("sends the template name (path to dirname) when the template is used from local path but there's no package.json at the root", async () => {
				const templateName = "localtemplate";
				const localTemplatePath = `/Users/username/${templateName}`;
				const fs = testInjector.resolve<IFileSystem>("fs");
				fs.exists = (localPath: string): boolean => path.basename(localPath) !== constants.PACKAGE_JSON_FILE_NAME;
				await projectTemplatesService.prepareTemplate(localTemplatePath, "tempFolder");
				assert.deepEqual(dataSentToGoogleAnalytics, [
					{
						action: constants.TrackActionNames.CreateProject,
						isForDevice: null,
						additionalData: `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateName}`
					},
					{
						action: constants.TrackActionNames.UsingTemplate,
						additionalData: `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateName}${constants.AnalyticsEventLabelDelimiter}${constants.TemplateVersions.v1}`
					}
				]);
			});
		});

		describe("template version", () => {
			it("is default when template does not have package.json", async () => {
				const testInjector = createTestInjector();
				testInjector.resolve<IFileSystem>("fs").exists = (filePath: string) => false;

				const projectTemplatesService = testInjector.resolve<IProjectTemplatesService>("projectTemplatesService");
				const { templateVersion } = await projectTemplatesService.prepareTemplate("typescript", "tempFolder");
				assert.strictEqual(templateVersion, constants.TemplateVersions.v1);
			});

			it("is default when template does not have nativescript key in its package.json", async () => {
				const testInjector = createTestInjector();
				const projectTemplatesService = testInjector.resolve<IProjectTemplatesService>("projectTemplatesService");
				const { templateVersion } = await projectTemplatesService.prepareTemplate("typescript", "tempFolder");
				assert.strictEqual(templateVersion, constants.TemplateVersions.v1);
			});

			it("is default when template does not have templateVersion property in the nativescript key in its package.json", async () => {
				const testInjector = createTestInjector({ packageJsonContent: { nativescript: {} } });
				const projectTemplatesService = testInjector.resolve<IProjectTemplatesService>("projectTemplatesService");
				const { templateVersion } = await projectTemplatesService.prepareTemplate("typescript", "tempFolder");
				assert.strictEqual(templateVersion, constants.TemplateVersions.v1);
			});

			it("is the one from template's package.json when it is valid version", async () => {
				const testInjector = createTestInjector({ packageJsonContent: { nativescript: { templateVersion: constants.TemplateVersions.v2 } } });
				const projectTemplatesService = testInjector.resolve<IProjectTemplatesService>("projectTemplatesService");
				const { templateVersion } = await projectTemplatesService.prepareTemplate("typescript", "tempFolder");
				assert.strictEqual(templateVersion, constants.TemplateVersions.v2);
			});

			it("fails when the templateVersion is invalid", async () => {
				const notSupportedVersionString = "not supported version";
				const testInjector = createTestInjector({ packageJsonContent: { nativescript: { templateVersion: notSupportedVersionString } } });
				const projectTemplatesService = testInjector.resolve<IProjectTemplatesService>("projectTemplatesService");
				const expectedError = format(constants.ProjectTemplateErrors.InvalidTemplateVersionStringFormat, 'tns-template-hello-world-ts', notSupportedVersionString);
				await assert.isRejected(projectTemplatesService.prepareTemplate("typescript", "tempFolder"), expectedError);
			});

		});
	});
});
