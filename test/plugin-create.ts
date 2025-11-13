import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { CreatePluginCommand } from "../lib/commands/plugin/create-plugin";
import { assert } from "chai";
import * as helpers from "../lib/common/helpers";
import * as sinon from "sinon";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import * as util from "util";
import { IOptions } from "../lib/declarations";
import { IInjector } from "../lib/common/definitions/yok";
import { IDictionary } from "../lib/common/declarations";

interface IPacoteOutput {
	packageName: string;
	destinationDirectory: string;
}

const originalIsInteractive = helpers.isInteractive;
const dummyProjectName = "dummyProjectName";
const dummyArgs = [dummyProjectName];
const dummyUser = "devUsername";
const dummyName = "devPlugin";
const createDemoProjectAnswer = true;
const creteDemoProjectOption = "y";
const dummyPacote: IPacoteOutput = {
	packageName: "",
	destinationDirectory: "",
};

function createTestInjector() {
	const testInjector = new Yok();

	testInjector.register("injector", testInjector);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("childProcess", stubs.ChildProcessStub);
	testInjector.register("prompter", new stubs.PrompterStub());
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("packageManager", stubs.PackageInstallationManagerStub);
	testInjector.register("options", {
		username: undefined,
		pluginName: undefined,
		template: undefined,
		path: undefined,
	});

	testInjector.register("terminalSpinnerService", {
		createSpinner: () => ({
			start: (): void => undefined,
			stop: (): void => undefined,
			message: (): void => undefined,
		}),
	});

	testInjector.register("pacoteService", {
		manifest: () => Promise.resolve(),
		extractPackage: (packageName: string, destinationDirectory: string) => {
			dummyPacote.destinationDirectory = destinationDirectory;
			dummyPacote.packageName = packageName;
			return Promise.resolve();
		},
	});

	testInjector.register("createCommand", CreatePluginCommand);

	return testInjector;
}

describe("Plugin create command tests", () => {
	let testInjector: IInjector;
	let options: IOptions;
	let createPluginCommand: CreatePluginCommand;

	beforeEach(() => {
		// @ts-expect-error
		helpers.isInteractive = () => true;
		testInjector = createTestInjector();
		options = testInjector.resolve("$options");
		createPluginCommand = testInjector.resolve("$createCommand");
	});

	afterEach(() => {
		// @ts-expect-error
		helpers.isInteractive = originalIsInteractive;
	});

	describe("#CreatePluginCommand", () => {
		it("should fail when project name is not set.", async () => {
			assert.isRejected(createPluginCommand.canExecute([]));
		});

		it("should use correct directory when path parameter is passed", async () => {
			// @ts-expect-error
			helpers.isInteractive = () => false;
			const dummyPath = "dummyPath";
			options.path = dummyPath;
			dummyPacote.destinationDirectory = "";
			await createPluginCommand.execute(dummyArgs);
			assert.include(dummyPacote.destinationDirectory, dummyPath);
		});

		it("should use correct download path when template parameter is passed", async () => {
			// @ts-expect-error
			helpers.isInteractive = () => false;
			const dummyTemplate = "dummyTemplate";
			options.template = dummyTemplate;
			dummyPacote.packageName = "";
			await createPluginCommand.execute(dummyArgs);
			assert.equal(dummyPacote.packageName, dummyTemplate);
		});

		it("should pass when only project name is set in non-interactive shell.", async () => {
			// @ts-expect-error
			helpers.isInteractive = () => false;
			await createPluginCommand.execute(dummyArgs);
		});

		it("should pass when all options are set with prompts in interactive shell.", async () => {
			const prompter = testInjector.resolve("$prompter");
			const strings: IDictionary<string> = {};
			const confirmQuestions: IDictionary<boolean> = {};
			strings[createPluginCommand.userMessage] = dummyUser;
			strings[createPluginCommand.nameMessage] = dummyName;
			confirmQuestions[createPluginCommand.includeTypeScriptDemoMessage] =
				createDemoProjectAnswer;
			confirmQuestions[createPluginCommand.includeAngularDemoMessage] =
				createDemoProjectAnswer;

			prompter.expect({
				strings: strings,
				confirmQuestions,
			});
			await createPluginCommand.execute(dummyArgs);
			prompter.assert();
		});

		it("should pass when username is passed with command line option and all other options are populated with prompts in interactive shell.", async () => {
			options.username = dummyUser;
			const prompter = testInjector.resolve("$prompter");
			const strings: IDictionary<string> = {};
			const confirmQuestions: IDictionary<boolean> = {};
			strings[createPluginCommand.nameMessage] = dummyName;
			confirmQuestions[createPluginCommand.includeTypeScriptDemoMessage] =
				createDemoProjectAnswer;
			confirmQuestions[createPluginCommand.includeAngularDemoMessage] =
				createDemoProjectAnswer;

			prompter.expect({
				strings: strings,
				confirmQuestions,
			});
			await createPluginCommand.execute(dummyArgs);
			prompter.assert();
		});

		it("should pass when plugin name is passed with command line option and all other options are populated with prompts in interactive shell.", async () => {
			options.pluginName = dummyName;
			const prompter = testInjector.resolve("$prompter");
			const strings: IDictionary<string> = {};
			const confirmQuestions: IDictionary<boolean> = {};

			strings[createPluginCommand.userMessage] = dummyUser;
			confirmQuestions[createPluginCommand.includeTypeScriptDemoMessage] =
				createDemoProjectAnswer;
			confirmQuestions[createPluginCommand.includeAngularDemoMessage] =
				createDemoProjectAnswer;

			prompter.expect({
				strings,
				confirmQuestions,
			});
			await createPluginCommand.execute(dummyArgs);
			prompter.assert();
		});

		it("should pass when includeTypeScriptDemo is passed with command line option and all other options are populated with prompts in interactive shell.", async () => {
			options.includeTypeScriptDemo = creteDemoProjectOption;
			const prompter = testInjector.resolve("$prompter");
			const strings: IDictionary<string> = {};
			const confirmQuestions: IDictionary<boolean> = {};
			strings[createPluginCommand.userMessage] = dummyUser;
			strings[createPluginCommand.nameMessage] = dummyName;
			confirmQuestions[createPluginCommand.includeAngularDemoMessage] =
				createDemoProjectAnswer;

			prompter.expect({
				strings: strings,
				confirmQuestions,
			});
			await createPluginCommand.execute(dummyArgs);
			prompter.assert();
		});

		it("should pass when includeAngularDemo is passed with command line option and all other options are populated with prompts in interactive shell.", async () => {
			options.includeAngularDemo = creteDemoProjectOption;
			const prompter = testInjector.resolve("$prompter");
			const strings: IDictionary<string> = {};
			const confirmQuestions: IDictionary<boolean> = {};

			strings[createPluginCommand.userMessage] = dummyUser;
			strings[createPluginCommand.nameMessage] = dummyName;
			confirmQuestions[createPluginCommand.includeTypeScriptDemoMessage] =
				createDemoProjectAnswer;

			prompter.expect({
				strings: strings,
				confirmQuestions,
			});
			await createPluginCommand.execute(dummyArgs);
			prompter.assert();
		});

		it("should pass with all options passed through command line opts with no prompt in interactive shell.", async () => {
			options.username = dummyUser;
			options.pluginName = dummyName;
			options.includeTypeScriptDemo = creteDemoProjectOption;
			options.includeAngularDemo = creteDemoProjectOption;

			await createPluginCommand.execute(dummyArgs);
		});

		describe("when fails", () => {
			let sandbox: sinon.SinonSandbox;
			let fsSpy: sinon.SinonSpy;
			let projectPath: string;

			beforeEach(() => {
				sandbox = sinon.createSandbox();
				const workingPath = mkdtempSync(path.join(tmpdir(), "test_plugin-"));
				options.path = workingPath;
				projectPath = path.join(workingPath, dummyProjectName);
				const fsService = testInjector.resolve("fs");
				fsSpy = sandbox.spy(fsService, "deleteDirectory");
			});

			afterEach(() => {
				sandbox.restore();
			});

			it("downloadPackage, should remove projectDir", async () => {
				const errorMessage = "Test fail";
				const pacoteService = testInjector.resolve("pacoteService");
				sandbox.stub(pacoteService, "extractPackage").callsFake(() => {
					return Promise.reject(new Error(errorMessage));
				});

				const executePromise = createPluginCommand.execute(dummyArgs);

				await assert.isRejected(executePromise, errorMessage);
				assert(fsSpy.calledWith(projectPath));
			});

			it("setupSeed, should remove projectDir", async () => {
				const errorMessage = "Test fail";
				const packageManagerService = testInjector.resolve("packageManager");
				sandbox.stub(packageManagerService, "install").callsFake(() => {
					return Promise.reject(new Error(errorMessage));
				});

				const executePromise = createPluginCommand.execute(dummyArgs);

				await assert.isRejected(executePromise, errorMessage);
				assert(fsSpy.calledWith(projectPath));
			});

			it("ensurePachageDir should not remove projectDir", async () => {
				const fsService = testInjector.resolve("fs");
				sandbox.stub(fsService, "isEmptyDir").callsFake(() => {
					return false;
				});

				const executePromise = createPluginCommand.execute(dummyArgs);

				await assert.isRejected(
					executePromise,
					util.format(
						createPluginCommand.pathAlreadyExistsMessageTemplate,
						projectPath,
					),
				);
				assert(fsSpy.notCalled);
			});
		});
	});
});
