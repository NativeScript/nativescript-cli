import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { ProjectTemplatesService } from "../lib/services/project-templates-service";
import { assert } from "chai";
import * as path from "path";
import temp = require("temp");

let isDeleteDirectoryCalledForNodeModulesDir = false;
let nativeScriptValidatedTemplatePath = "nsValidatedTemplatePath";

function createTestInjector(configuration?: { shouldNpmInstallThrow: boolean, npmInstallationDirContents: string[], npmInstallationDirNodeModulesContents: string[] }): IInjector {
	let injector = new Yok();
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
				let tempFolder = temp.mkdirSync("preparetemplate");
				await assert.isRejected(projectTemplatesService.prepareTemplate("invalidName", tempFolder));
			});
		});

		describe("returns correct path to template", () => {
			it("when reserved template name is used", async () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: [] });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let tempFolder = temp.mkdirSync("preparetemplate");
				let actualPathToTemplate = await projectTemplatesService.prepareTemplate("typescript", tempFolder);
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("when reserved template name is used (case-insensitive test)", async () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: [] });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let tempFolder = temp.mkdirSync("preparetemplate");
				let actualPathToTemplate = await projectTemplatesService.prepareTemplate("tYpEsCriPT", tempFolder);
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("uses defaultTemplate when undefined is passed as parameter", async () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: [] });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let tempFolder = temp.mkdirSync("preparetemplate");
				let actualPathToTemplate = await projectTemplatesService.prepareTemplate(undefined, tempFolder);
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});
		});
	});
});
