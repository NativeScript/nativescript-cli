import {Yok} from "../lib/common/yok";
import * as stubs from "./stubs";
import {ProjectTemplatesService} from "../lib/services/project-templates-service";
import * as assert from "assert";
import Future = require("fibers/future");
import * as path from "path";

let isDeleteDirectoryCalledForNodeModulesDir = false;
let expectedTemplatePath = "templatePath";
let nativeScriptValidatedTemplatePath = "nsValidatedTemplatePath";

function createTestInjector(configuration?: {shouldNpmInstallThrow: boolean, npmInstallationDirContents: string[], npmInstallationDirNodeModulesContents: string[]}): IInjector {
	let injector = new Yok();
	injector.register("errors", stubs.ErrorsStub);
	injector.register("logger", stubs.LoggerStub);
	injector.register("fs", {
		readDirectory: (dirPath: string) => {
			if(dirPath.toLowerCase().indexOf("node_modules") !== -1) {
				return Future.fromResult(configuration.npmInstallationDirNodeModulesContents);
			}
			return Future.fromResult(configuration.npmInstallationDirContents);
		},

		deleteDirectory: (directory: string) => {
			if(directory.indexOf("node_modules") !== -1) {
				isDeleteDirectoryCalledForNodeModulesDir = true;
			}
			return Future.fromResult();
		}

	});
	injector.register("npm", {
		install: (packageName: string, pathToSave: string, config?: any) => {
			return (() => {
				if(configuration.shouldNpmInstallThrow) {
					throw new Error("NPM install throws error.");
				}

				return "sample result";
			}).future<any>()();
		}
	});

	injector.register("npmInstallationManager", {
		install: (packageName: string, options?: INpmInstallOptions) => {
			return Future.fromResult(nativeScriptValidatedTemplatePath);
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
		describe("throws error", () =>{
			it("when npm install fails", () => {
				testInjector = createTestInjector({shouldNpmInstallThrow: true, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: null});
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				assert.throws(() => projectTemplatesService.prepareTemplate("invalidName").wait());
			});

			it("when after npm install the temp directory does not have any content", () => {
				testInjector = createTestInjector({shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: null});
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				assert.throws(() => projectTemplatesService.prepareTemplate("validName").wait());
			});

			it("when after npm install the temp directory has more than one subdir", () => {
				testInjector = createTestInjector({shouldNpmInstallThrow: false, npmInstallationDirContents: ["dir1", "dir2"], npmInstallationDirNodeModulesContents: []});
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				assert.throws(() => projectTemplatesService.prepareTemplate("validName").wait());
			});

			it("when after npm install the temp directory has only node_modules directory and there's nothing inside node_modules", () => {
				testInjector = createTestInjector({shouldNpmInstallThrow: false, npmInstallationDirContents: ["node_modules"], npmInstallationDirNodeModulesContents: []});
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				assert.throws(() => projectTemplatesService.prepareTemplate("validName").wait());
			});
		});

		describe("returns correct path to template", () => {
			it("when after npm install the temp directory has only one subdir and it is not node_modules", () =>{
				testInjector = createTestInjector({shouldNpmInstallThrow: false, npmInstallationDirContents: [expectedTemplatePath], npmInstallationDirNodeModulesContents: []});
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let actualPathToTemplate = projectTemplatesService.prepareTemplate("validName").wait();
				assert.strictEqual(path.basename(actualPathToTemplate), expectedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("when after npm install the temp directory has only one subdir and it is node_modules", () =>{
				testInjector = createTestInjector({shouldNpmInstallThrow: false, npmInstallationDirContents: ["node_modules"], npmInstallationDirNodeModulesContents: [expectedTemplatePath]});
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let actualPathToTemplate = projectTemplatesService.prepareTemplate("validName").wait();
				assert.strictEqual(path.basename(actualPathToTemplate), expectedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("when reserved template name is used", () =>{
				testInjector = createTestInjector({shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: []});
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let actualPathToTemplate = projectTemplatesService.prepareTemplate("typescript").wait();
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("when reserved template name is used (case-insensitive test)", () =>{
				testInjector = createTestInjector({shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: []});
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let actualPathToTemplate = projectTemplatesService.prepareTemplate("tYpEsCriPT").wait();
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});

			it("uses defaultTemplate when undefined is passed as parameter", () =>{
				testInjector = createTestInjector({shouldNpmInstallThrow: false, npmInstallationDirContents: [], npmInstallationDirNodeModulesContents: []});
				projectTemplatesService = testInjector.resolve("projectTemplatesService");
				let actualPathToTemplate = projectTemplatesService.prepareTemplate(undefined).wait();
				assert.strictEqual(path.basename(actualPathToTemplate), nativeScriptValidatedTemplatePath);
				assert.strictEqual(isDeleteDirectoryCalledForNodeModulesDir, true, "When correct path is returned, template's node_modules directory should be deleted.");
			});
		});
	});
});
