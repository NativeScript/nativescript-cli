import { Yok } from "../../lib/common/yok";
import { PlatformEnvironmentRequirements } from '../../lib/services/platform-environment-requirements';
import * as stubs from "../stubs";
import { assert } from "chai";
import { EOL } from "os";
import { IPlatformEnvironmentRequirements } from "../../lib/definitions/platform";
import { IInjector } from "../../lib/common/definitions/yok";
const helpers = require("../../lib/common/helpers");

const originalIsInteractive = helpers.isInteractive;
const platform = "android";
const manuallySetupErrorMessage = `To be able to build for ${platform}, verify that your environment is configured according to the system requirements described at `;
const nonInteractiveConsoleMessage = `Your environment is not configured properly and you will not be able to execute local builds. To continue, choose one of the following options: ${EOL}Run $ tns preview command to enjoy NativeScript without any local setup.${EOL}Run $ tns setup command to run the setup script to try to automatically configure your environment for local builds.${EOL}Verify that your environment is configured according to the system requirements described at .`;

function createTestInjector() {
	const testInjector = new Yok();

	testInjector.register("analyticsService", {
		trackEventActionInGoogleAnalytics: () => ({})
	});
	testInjector.register("commandsService", { currentCommandData: { commandName: "test", commandArguments: [""] } });
	testInjector.register("doctorService", {});
	testInjector.register("hooksService", stubs.HooksServiceStub);
	testInjector.register("errors", {
		fail: (err: any) => {
			throw new Error(err.formatStr || err.message || err);
		}
	});
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("prompter", {});
	testInjector.register("platformEnvironmentRequirements", PlatformEnvironmentRequirements);
	testInjector.register("staticConfig", { SYS_REQUIREMENTS_LINK: "" });
	testInjector.register("previewQrCodeService", {});

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
		let platformEnvironmentRequirements: IPlatformEnvironmentRequirements = null;
		let promptForChoiceData: { message: string, choices: string[] }[] = [];

		function mockDoctorService(data: { canExecuteLocalBuild: boolean, mockSetupScript?: boolean }) {
			const doctorService = testInjector.resolve("doctorService");
			doctorService.canExecuteLocalBuild = () => data.canExecuteLocalBuild;
			if (data.mockSetupScript) {
				doctorService.runSetupScript = () => Promise.resolve();
			}
		}

		function mockPrompter(data: { firstCallOptionName: string, secondCallOptionName?: string }) {
			const prompter = testInjector.resolve("prompter");
			prompter.promptForChoice = (message: string, choices: string[]) => {
				promptForChoiceData.push({ message: message, choices: choices });

				if (promptForChoiceData.length === 1) {
					return Promise.resolve(data.firstCallOptionName);
				}

				if (data.secondCallOptionName) {
					return Promise.resolve(data.secondCallOptionName);
				}
			};
		}

		beforeEach(() => {
			testInjector = createTestInjector();
			platformEnvironmentRequirements = testInjector.resolve("platformEnvironmentRequirements");
			process.stdout.isTTY = true;
			process.stdin.isTTY = true;
		});

		afterEach(() => {
			promptForChoiceData = [];
			delete process.env.NS_SKIP_ENV_CHECK;
		});

		it("should return true when environment is configured", async () => {
			mockDoctorService({ canExecuteLocalBuild: true });
			const result = await platformEnvironmentRequirements.checkEnvironmentRequirements({ platform });
			assert.isTrue(result.canExecute);
			assert.isTrue(promptForChoiceData.length === 0);
		});
		it("should show prompt when environment is not configured", async () => {
			mockDoctorService({ canExecuteLocalBuild: false });
			mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME });

			await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }));
			assert.isTrue(promptForChoiceData.length === 1);
			assert.deepEqual("To continue, choose one of the following options: ", promptForChoiceData[0].message);
			assert.deepEqual(['Sync to Playground', 'Configure for Local Builds', 'Skip Step and Configure Manually'], promptForChoiceData[0].choices);
		});

		it("should not show 'Sync to Playground' option when hideSyncToPreviewAppOption is provided", async () => {
			mockDoctorService({ canExecuteLocalBuild: false });
			mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME });

			await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform, notConfiguredEnvOptions: { hideSyncToPreviewAppOption: true } }));
			assert.isTrue(promptForChoiceData.length === 1);
			assert.deepEqual("To continue, choose one of the following options: ", promptForChoiceData[0].message);
			assert.deepEqual(['Configure for Local Builds', 'Skip Step and Configure Manually'], promptForChoiceData[0].choices);
		});
		it("should skip env check when NS_SKIP_ENV_CHECK environment variable is passed", async () => {
			(<any>process.env).NS_SKIP_ENV_CHECK = true;

			const output = await platformEnvironmentRequirements.checkEnvironmentRequirements({ platform });

			assert.isTrue(output.canExecute);
			assert.isTrue(promptForChoiceData.length === 0);
		});

		describe("when local setup option is selected", () => {
			beforeEach(() => {
				mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME });
			});

			it("should return true when env is configured after executing setup script", async () => {
				const doctorService = testInjector.resolve("doctorService");
				doctorService.canExecuteLocalBuild = () => false;
				doctorService.runSetupScript = async () => { doctorService.canExecuteLocalBuild = () => true; };

				const output = await platformEnvironmentRequirements.checkEnvironmentRequirements({ platform });
				assert.isTrue(output.canExecute);
			});

			describe("and env is not configured after executing setup script", () => {
				beforeEach(() => {
					mockDoctorService({ canExecuteLocalBuild: false, mockSetupScript: true });
				});

				it("should list 2 posibile options to select", async () => {
					mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME });

					await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }),
					"The setup script was not able to configure your environment for local builds. To execute local builds, you have to set up your environment manually." +
					" Please consult our setup instructions here 'https://docs.nativescript.org/start/quick-setup");
				});
			});
		});

		describe("when manually setup option is selected", () => {
			beforeEach(() => {
				mockDoctorService({ canExecuteLocalBuild: false });
				mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME });
			});

			it("should fail", async () => {
				await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }), manuallySetupErrorMessage);
			});
		});

		describe("when console is non interactive", () => {
			beforeEach(() => {
				helpers.isInteractive = () => false;
				mockDoctorService({ canExecuteLocalBuild: false });
			});

			it("should fail", async () => {
				await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }), nonInteractiveConsoleMessage);
			});
		});
	});
});
