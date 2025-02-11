import { Yok } from "../../lib/common/yok";
import { PlatformEnvironmentRequirements } from "../../lib/services/platform-environment-requirements";
import * as stubs from "../stubs";
import { assert } from "chai";
// import { EOL } from "os";
import { IPlatformEnvironmentRequirements } from "../../lib/definitions/platform";
import { IInjector } from "../../lib/common/definitions/yok";
const helpers = require("../../lib/common/helpers");

const originalIsInteractive = helpers.isInteractive;
const platform = "android";
// const manuallySetupErrorMessage = `To be able to build for ${platform}, verify that your environment is configured according to the system requirements described at `;
// const nonInteractiveConsoleMessage = `Your environment is not configured properly and you will not be able to execute local builds. ${EOL}Verify that your environment is configured according to the system requirements described at`;

function createTestInjector() {
	const testInjector = new Yok();

	testInjector.register("analyticsService", {
		trackEventActionInGoogleAnalytics: () => ({})
	});
	testInjector.register("commandsService", {
		currentCommandData: { commandName: "test", commandArguments: [""] }
	});
	testInjector.register("doctorService", {});
	testInjector.register("hooksService", stubs.HooksServiceStub);
	testInjector.register("errors", {
		fail: (err: any) => {
			throw new Error(err.formatStr || err.message || err);
		}
	});
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("prompter", {});
	testInjector.register(
		"platformEnvironmentRequirements",
		PlatformEnvironmentRequirements
	);
	testInjector.register("staticConfig", { SYS_REQUIREMENTS_LINK: "" });

	return testInjector;
}

describe("platformEnvironmentRequirements ", () => {
	beforeEach(() => {
		helpers.isInteractive = () => true;
	});

	afterEach(() => {
		helpers.isInteractive = originalIsInteractive;
	});

	describe("checkRequirements", () => {
		let testInjector: IInjector = null;
		let platformEnvironmentRequirements: IPlatformEnvironmentRequirements =
			null;
		let promptForChoiceData: { message: string; choices: string[] }[] = [];

		function mockDoctorService(data: {
			canExecuteLocalBuild: boolean;
			mockSetupScript?: boolean;
		}) {
			const doctorService = testInjector.resolve("doctorService");
			doctorService.canExecuteLocalBuild = () => data.canExecuteLocalBuild;
			if (data.mockSetupScript) {
				doctorService.runSetupScript = () => Promise.resolve();
			}
		}

		// function mockPrompter(data: {
		// 	firstCallOptionName: string;
		// 	secondCallOptionName?: string;
		// }) {
		// 	const prompter = testInjector.resolve("prompter");
		// 	prompter.promptForChoice = (message: string, choices: string[]) => {
		// 		promptForChoiceData.push({ message: message, choices: choices });
		//
		// 		if (promptForChoiceData.length === 1) {
		// 			return Promise.resolve(data.firstCallOptionName);
		// 		}
		//
		// 		if (data.secondCallOptionName) {
		// 			return Promise.resolve(data.secondCallOptionName);
		// 		}
		// 	};
		// }

		beforeEach(() => {
			testInjector = createTestInjector();
			platformEnvironmentRequirements = testInjector.resolve(
				"platformEnvironmentRequirements"
			);
			process.stdout.isTTY = true;
			process.stdin.isTTY = true;
		});

		afterEach(() => {
			promptForChoiceData = [];
			delete process.env.NS_SKIP_ENV_CHECK;
		});

		it("should return true when environment is configured", async () => {
			mockDoctorService({ canExecuteLocalBuild: true });
			const result =
				await platformEnvironmentRequirements.checkEnvironmentRequirements({
					platform
				});
			assert.isTrue(result.canExecute);
			assert.isTrue(promptForChoiceData.length === 0);
		});

		it("should skip env check when NS_SKIP_ENV_CHECK environment variable is passed", async () => {
			(<any>process.env).NS_SKIP_ENV_CHECK = true;

			const output =
				await platformEnvironmentRequirements.checkEnvironmentRequirements({
					platform
				});

			assert.isTrue(output.canExecute);
			assert.isTrue(promptForChoiceData.length === 0);
		});

		describe("when console is non interactive", () => {
			beforeEach(() => {
				helpers.isInteractive = () => false;
				mockDoctorService({ canExecuteLocalBuild: false });
			});

			it("should fail", async () => {
				await assert.isRejected(
					platformEnvironmentRequirements.checkEnvironmentRequirements({
						platform
					})
				);
			});
		});
	});
});
