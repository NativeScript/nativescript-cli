import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { ProjectTemplatesService } from "../lib/services/project-templates-service";
import * as assert from "assert";
import Future = require("fibers/future");
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

			return Future.fromResult(nativeScriptValidatedTemplatePath);
		}
	});

	injector.register("projectTemplatesService", ProjectTemplatesService);

	injector.register("analyticsService", { track: () => Future.fromResult() });

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
			it("when npm install fails", () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: true, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: null });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let tempFolder = temp.mkdirSync("preparetemplate");
				assert.throws(() => projectTemplatesService.prepareTemplate("invalidName", tempFolder).wait());
			});
		});

		describe("returns correct path to template", () => {
			it("when reserved template name is used", () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: [] });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let tempFolder = temp.mkdirSync("preparetemplate");
				let actualPathToTemplate = projectTemplatesService.prepareTemplate("typescript", tempFolder).wait();
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("when reserved template name is used (case-insensitive test)", () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: [] });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let tempFolder = temp.mkdirSync("preparetemplate");
				let actualPathToTemplate = projectTemplatesService.prepareTemplate("tYpEsCriPT", tempFolder).wait();
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("uses defaultTemplate when undefined is passed as parameter", () => {
				testInjector = createTestInjector({ shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: [] });
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let tempFolder = temp.mkdirSync("preparetemplate");
				let actualPathToTemplate = projectTemplatesService.prepareTemplate(undefined, tempFolder).wait();
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});
		});
	});
});
