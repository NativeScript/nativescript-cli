import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { CreatePluginCommand } from "../lib/commands/plugin/create-plugin";
import { assert } from "chai";
import helpers = require("../lib/common/helpers");

interface IPacoteOutput {
	packageName: string;
	destinationDirectory: string;
}

const originalIsInteractive = helpers.isInteractive;
const dummyArgs = ["dummyProjectName"];
const dummyUser = "devUsername";
const dummyName = "devPlugin";
const dummyPacote: IPacoteOutput = { packageName: "", destinationDirectory: "" };

function createTestInjector() {
	const testInjector = new Yok();

	testInjector.register("injector", testInjector);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("childProcess", stubs.ChildProcessStub);
	testInjector.register("prompter", new stubs.PrompterStub());
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("packageManager", stubs.NpmInstallationManagerStub);
	testInjector.register("options", {
		username: undefined,
		pluginName: undefined,
		template: undefined,
		path: undefined
	});

	testInjector.register("terminalSpinnerService", {
		createSpinner: () => ({
			start: (): void => undefined,
			stop: (): void => undefined,
			message: (): void => undefined
		})
	});

	testInjector.register("pacoteService", {
		manifest: () => Promise.resolve(),
		extractPackage: (packageName: string, destinationDirectory: string) => {
			dummyPacote.destinationDirectory = destinationDirectory;
			dummyPacote.packageName = packageName;
			return Promise.resolve();
		}
	});

	testInjector.register("createCommand", CreatePluginCommand);

	return testInjector;
}

describe("Plugin create command tests", () => {
	let testInjector: IInjector;
	let options: IOptions;
	let createPluginCommand: CreatePluginCommand;

	beforeEach(() => {
		helpers.isInteractive = () => true;
		testInjector = createTestInjector();
		options = testInjector.resolve("$options");
		createPluginCommand = testInjector.resolve("$createCommand");
	});

	afterEach(() => {
		helpers.isInteractive = originalIsInteractive;
	});

	describe("#CreatePluginCommand", () => {
		it("should fail when project name is not set.", async () => {
			assert.isRejected(createPluginCommand.canExecute([]));
		});

		it("should use correct directory when path parameter is passed", async () => {
			helpers.isInteractive = () => false;
			const dummyPath = "dummyPath";
			options.path = dummyPath;
			dummyPacote.destinationDirectory = "";
			await createPluginCommand.execute(dummyArgs);
			assert.include(dummyPacote.destinationDirectory, dummyPath);
		});

		it("should use correct download path when template parameter is passed", async () => {
			helpers.isInteractive = () => false;
			const dummyTemplate = "dummyTemplate";
			options.template = dummyTemplate;
			dummyPacote.packageName = "";
			await createPluginCommand.execute(dummyArgs);
			assert.equal(dummyPacote.packageName, dummyTemplate);
		});

		it("should pass when only project name is set in non-interactive shell.", async () => {
			helpers.isInteractive = () => false;
			await createPluginCommand.execute(dummyArgs);
		});

		it("should pass when only project name is set with prompts in interactive shell.", async () => {
			const prompter = testInjector.resolve("$prompter");
			const strings: IDictionary<string> = {};
			strings[createPluginCommand.userMessage] = dummyUser;
			strings[createPluginCommand.nameMessage] = dummyName;

			prompter.expect({
				strings: strings
			});
			await createPluginCommand.execute(dummyArgs);
			prompter.assert();
		});

		it("should pass with project name and username set with one prompt in interactive shell.", async () => {
			options.username = dummyUser;
			const prompter = testInjector.resolve("$prompter");
			const strings: IDictionary<string> = {};
			strings[createPluginCommand.nameMessage] = dummyName;

			prompter.expect({
				strings: strings
			});
			await createPluginCommand.execute(dummyArgs);
			prompter.assert();
		});

		it("should pass with project name and pluginName set with one prompt in interactive shell.", async () => {
			options.pluginName = dummyName;
			const prompter = testInjector.resolve("$prompter");
			const strings: IDictionary<string> = {};
			strings[createPluginCommand.userMessage] = dummyUser;

			prompter.expect({
				strings: strings
			});
			await createPluginCommand.execute(dummyArgs);
			prompter.assert();
		});

		it("should pass with project name, username and pluginName set with no prompt in interactive shell.", async () => {
			options.username = dummyUser;
			options.pluginName = dummyName;
			await createPluginCommand.execute(dummyArgs);
		});
	});
});
