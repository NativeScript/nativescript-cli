import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { ProjectTemplatesService } from "../lib/services/project-templates-service";
import { assert } from "chai";
import * as path from "path";
import * as constants from "../lib/constants";
import {
	INpmInstallResultInfo,
	INodePackageManagerInstallOptions,
	INpmPackageNameParts,
	INpmInstallOptions,
} from "../lib/declarations";
import { IProjectTemplatesService } from "../lib/definitions/project";
import { IInjector } from "../lib/common/definitions/yok";
import { IAnalyticsService, IFileSystem } from "../lib/common/declarations";
import { IEventActionData } from "../lib/common/definitions/google-analytics";

const nativeScriptValidatedTemplatePath = "nsValidatedTemplatePath";
const compatibleTemplateVersion = "1.2.3";

function createTestInjector(
	configuration: {
		shouldNpmInstallThrow?: boolean;
		packageJsonContent?: any;
		packageVersion?: string;
		packageName?: string;
	} = {}
): IInjector {
	const injector = new Yok();
	injector.register("errors", stubs.ErrorsStub);
	injector.register("logger", stubs.LoggerStub);
	injector.register("fs", {
		exists: (pathToCheck: string) => false,
		readJson: (pathToFile: string) => configuration.packageJsonContent || {},
	});

	class NpmStub extends stubs.NodePackageManagerStub {
		public async install(
			packageName: string,
			pathToSave: string,
			config: INodePackageManagerInstallOptions
		): Promise<INpmInstallResultInfo> {
			if (configuration.shouldNpmInstallThrow) {
				throw new Error("NPM install throws error.");
			}

			return { name: "Some Result", version: "1" };
		}
		async getPackageNameParts(
			fullPackageName: string
		): Promise<INpmPackageNameParts> {
			return {
				name: configuration.packageName || fullPackageName,
				version: configuration.packageVersion || "",
			};
		}
	}

	injector.register("packageManager", NpmStub);

	class NpmInstallationManagerStub extends stubs.PackageInstallationManagerStub {
		async install(
			packageName: string,
			pathToSave?: string,
			options?: INpmInstallOptions
		): Promise<string> {
			if (configuration.shouldNpmInstallThrow) {
				throw new Error("NPM install throws error.");
			}

			return Promise.resolve(nativeScriptValidatedTemplatePath);
		}
		async getLatestCompatibleVersionSafe(packageName: string): Promise<string> {
			return compatibleTemplateVersion;
		}
	}

	injector.register("packageInstallationManager", NpmInstallationManagerStub);

	injector.register("projectTemplatesService", ProjectTemplatesService);

	injector.register("analyticsService", {
		track: async (): Promise<any[]> => undefined,
		trackEventActionInGoogleAnalytics: (data: IEventActionData) =>
			Promise.resolve(),
	});

	injector.register("pacoteService", {
		manifest: (packageName: string) => {
			const packageJsonContent = configuration.packageJsonContent || {};
			packageJsonContent.name = packageName;
			return Promise.resolve(packageJsonContent);
		},
	});

	return injector;
}

describe("project-templates-service", () => {
	describe("prepareTemplate", () => {
		// describe("returns correct path to template", () => {
		// 	// it("when reserved template name is used", async () => {
		// 	// 	const testInjector = createTestInjector();
		// 	// 	const projectTemplatesService = testInjector.resolve<
		// 	// 		IProjectTemplatesService
		// 	// 	>("projectTemplatesService");
		// 	// 	const { templatePath } = await projectTemplatesService.prepareTemplate(
		// 	// 		"typescript",
		// 	// 		"tempFolder"
		// 	// 	);
		// 	// 	assert.strictEqual(
		// 	// 		path.basename(templatePath),
		// 	// 		nativeScriptValidatedTemplatePath
		// 	// 	);
		// 	// 	assert.strictEqual(
		// 	// 		isDeleteDirectoryCalledForNodeModulesDir,
		// 	// 		true,
		// 	// 		"When correct path is returned, template's node_modules directory should be deleted."
		// 	// 	);
		// 	// });
		// 	//
		// 	// it("when reserved template name is used (case-insensitive test)", async () => {
		// 	// 	const testInjector = createTestInjector();
		// 	// 	const projectTemplatesService = testInjector.resolve<
		// 	// 		IProjectTemplatesService
		// 	// 	>("projectTemplatesService");
		// 	// 	const { templatePath } = await projectTemplatesService.prepareTemplate(
		// 	// 		"tYpEsCriPT",
		// 	// 		"tempFolder"
		// 	// 	);
		// 	// 	assert.strictEqual(
		// 	// 		path.basename(templatePath),
		// 	// 		nativeScriptValidatedTemplatePath
		// 	// 	);
		// 	// 	assert.strictEqual(
		// 	// 		isDeleteDirectoryCalledForNodeModulesDir,
		// 	// 		true,
		// 	// 		"When correct path is returned, template's node_modules directory should be deleted."
		// 	// 	);
		// 	// });
		//
		//
		// });
		it("uses defaultTemplate when undefined is passed as parameter", async () => {
			const testInjector = createTestInjector();
			const projectTemplatesService = testInjector.resolve<
				IProjectTemplatesService
			>("projectTemplatesService");
			const { templateName } = await projectTemplatesService.prepareTemplate(
				undefined, //constants.RESERVED_TEMPLATE_NAMES["default"],
				"tempFolder"
			);
			assert.strictEqual(
				templateName,
				constants.RESERVED_TEMPLATE_NAMES["default"]
			);
			// assert.strictEqual(
			// 	isDeleteDirectoryCalledForNodeModulesDir,
			// 	true,
			// 	"When correct path is returned, template's node_modules directory should be deleted."
			// );
		});

		describe("sends correct information to Google Analytics", () => {
			let analyticsService: IAnalyticsService;
			let dataSentToGoogleAnalytics: IEventActionData[] = [];
			let testInjector: IInjector;
			let projectTemplatesService: IProjectTemplatesService;

			beforeEach(() => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false });
				analyticsService = testInjector.resolve<IAnalyticsService>(
					"analyticsService"
				);
				const fs = testInjector.resolve<IFileSystem>("fs");
				fs.exists = (filePath: string) => false;
				dataSentToGoogleAnalytics = [];
				analyticsService.trackEventActionInGoogleAnalytics = async (
					data: IEventActionData
				): Promise<void> => {
					dataSentToGoogleAnalytics.push(data);
				};
				projectTemplatesService = testInjector.resolve(
					"projectTemplatesService"
				);
			});

			it("sends template name when the template is used from npm", async () => {
				const templateName = "template-from-npm";
				await projectTemplatesService.prepareTemplate(
					templateName,
					"tempFolder"
				);
				assert.deepStrictEqual(dataSentToGoogleAnalytics, [
					{
						action: constants.TrackActionNames.CreateProject,
						isForDevice: null,
						additionalData: templateName,
					},
					{
						action: constants.TrackActionNames.UsingTemplate,
						additionalData: templateName,
					},
				]);
			});

			it("sends template name (from template's package.json) when the template is used from local path", async () => {
				const templateName = "my-own-local-template";
				const localTemplatePath = "/Users/username/localtemplate";
				const fs = testInjector.resolve<IFileSystem>("fs");
				fs.exists = (filePath: string): boolean => true;
				const pacoteService = testInjector.resolve<IPacoteService>(
					"pacoteService"
				);
				pacoteService.manifest = () => Promise.resolve({ name: templateName });
				await projectTemplatesService.prepareTemplate(
					localTemplatePath,
					"tempFolder"
				);
				assert.deepStrictEqual(dataSentToGoogleAnalytics, [
					{
						action: constants.TrackActionNames.CreateProject,
						isForDevice: null,
						additionalData: `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateName}`,
					},
					{
						action: constants.TrackActionNames.UsingTemplate,
						additionalData: `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateName}`,
					},
				]);
			});

			it("sends the template name (path to dirname) when the template is used from local path but there's no package.json at the root", async () => {
				const templateName = "localtemplate";
				const localTemplatePath = `/Users/username/${templateName}`;
				const fs = testInjector.resolve<IFileSystem>("fs");
				fs.exists = (localPath: string): boolean =>
					path.basename(localPath) !== constants.PACKAGE_JSON_FILE_NAME;
				const pacoteService = testInjector.resolve<IPacoteService>(
					"pacoteService"
				);
				pacoteService.manifest = () => Promise.resolve({});
				await projectTemplatesService.prepareTemplate(
					localTemplatePath,
					"tempFolder"
				);
				assert.deepStrictEqual(dataSentToGoogleAnalytics, [
					{
						action: constants.TrackActionNames.CreateProject,
						isForDevice: null,
						additionalData: `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateName}`,
					},
					{
						action: constants.TrackActionNames.UsingTemplate,
						additionalData: `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateName}`,
					},
				]);
			});
		});

		describe("uses correct version", () => {
			[
				{
					name: "is correct when package version is passed",
					templateName: "some-template@1.0.0",
					expectedVersion: "1.0.0",
					expectedTemplateName: "some-template",
				},
				{
					name: "is correct when reserved package name with version is passed",
					templateName: "typescript@1.0.0",
					expectedVersion: "1.0.0",
					expectedTemplateName: "@nativescript/template-hello-world-ts",
				},
				{
					name: "is correct when scoped package name without version is passed",
					templateName: "@nativescript/vue-template",
					expectedVersion: compatibleTemplateVersion,
					expectedTemplateName: "@nativescript/vue-template",
				},
				{
					name: "is correct when scoped package name with version is passed",
					templateName: "@nativescript/vue-template@1.0.0",
					expectedVersion: "1.0.0",
					expectedTemplateName: "@nativescript/vue-template",
				},
			].forEach((testCase) => {
				it(testCase.name, async () => {
					const testInjector = createTestInjector({
						packageVersion: testCase.expectedVersion,
						packageName: testCase.expectedTemplateName,
					});
					const projectTemplatesService = testInjector.resolve<
						IProjectTemplatesService
					>("projectTemplatesService");
					const {
						version,
						templateName,
					} = await projectTemplatesService.prepareTemplate(
						testCase.templateName,
						"tempFolder"
					);
					assert.strictEqual(version, testCase.expectedVersion);
					assert.strictEqual(templateName, testCase.expectedTemplateName);
				});
			});
		});
	});
});
