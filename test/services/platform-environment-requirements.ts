import { Yok } from "../../lib/common/yok";
import { PlatformEnvironmentRequirements } from '../../lib/services/platform-environment-requirements';
import * as stubs from "../stubs";
import { assert } from "chai";

const data = {platform: "android", cloudCommandName: "build"};
const cloudBuildsErrorMessage = `Use the $ tns login command to log in with your account and then $ tns cloud ${data.cloudCommandName.toLowerCase()} ${data.platform.toLowerCase()} command to build your app in the cloud.`;
function getManuallySetupErrorMessage(testInjector: IInjector) {
	const staticConfig = testInjector.resolve("staticConfig");
	return `To be able to build for ${data.platform}, verify that your environment is configured according to the system requirements described at ${staticConfig.SYS_REQUIREMENTS_LINK}`;
}

function createTestInjector() {
	const testInjector = new Yok();

	testInjector.register("doctorService", {});
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("extensibilityService", {});
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("prompter", {});
	testInjector.register("platformEnvironmentRequirements", PlatformEnvironmentRequirements);
	testInjector.register("staticConfig", { SYS_REQUIREMENTS_LINK: "" });

	return testInjector;
}

describe("platformEnvironmentRequirements ", () => {
	describe("checkRequirements", () => {
		let testInjector: IInjector = null;
		let platformEnvironmentRequirements: IPlatformEnvironmentRequirements = null;

		beforeEach(() => {
			testInjector = createTestInjector();
			platformEnvironmentRequirements = testInjector.resolve("platformEnvironmentRequirements");
		});

		it("should show prompt when environment is not configured", async () => {
			const doctorService = testInjector.resolve("doctorService");
			doctorService.canExecuteLocalBuild = () => false;

			let isPromptForChoiceCalled = false;
			const prompter = testInjector.resolve("prompter");
			prompter.promptForChoice = () => {
				isPromptForChoiceCalled = true;
				return PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME;
			};

			let isInstallExtensionCalled = false;
			const extensibilityService = testInjector.resolve("extensibilityService");
			extensibilityService.installExtension = () => {isInstallExtensionCalled = true; };

			await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements(data));
			assert.isTrue(isPromptForChoiceCalled);
			assert.isTrue(isInstallExtensionCalled);
		});

		it("should return true when environment is configured", async () => {
			const doctorService = testInjector.resolve("doctorService");
			doctorService.canExecuteLocalBuild = () => true;

			const result = await platformEnvironmentRequirements.checkEnvironmentRequirements(data);
			assert.isTrue(result);
		});

		describe("when setup script option is selected ", () => {
			it("should return true when env is configured after executing setup script", async () => {
				let index = 0;
				const doctorService = testInjector.resolve("doctorService");
				doctorService.canExecuteLocalBuild = () => {
					if (index === 0) {
						index++;
						return false;
					}

					return true;
				};
				doctorService.runSetupScript = () => Promise.resolve();

				const prompter = testInjector.resolve("prompter");
				prompter.promptForChoice = () => Promise.resolve(PlatformEnvironmentRequirements.SETUP_SCRIPT_OPTION_NAME);

				const result = await platformEnvironmentRequirements.checkEnvironmentRequirements(data);
				assert.isTrue(result);
			});
			it("should prompt for choice when env is not configured after executing setup script", async () => {
				const doctorService = testInjector.resolve("doctorService");
				doctorService.canExecuteLocalBuild = () => false;
				doctorService.runSetupScript = () => Promise.resolve();

				let index = 0;
				let isPromptForChoiceCalled = false;
				const prompter = testInjector.resolve("prompter");
				prompter.promptForChoice = () => {
					if (index === 0) {
						index++;
						return PlatformEnvironmentRequirements.SETUP_SCRIPT_OPTION_NAME;
					}

					isPromptForChoiceCalled = true;
					return PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME;
				};

				let isInstallExtensionCalled = false;
				const extensibilityService = testInjector.resolve("extensibilityService");
				extensibilityService.installExtension = () => {isInstallExtensionCalled = true; };

				await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements(data));
				assert.isTrue(isInstallExtensionCalled);
				assert.isTrue(isPromptForChoiceCalled);
			});

			describe("and environment is not configured after executing setup script ", () => {
				beforeEach(() => {
					const doctorService = testInjector.resolve("doctorService");
					doctorService.canExecuteLocalBuild = () => false;
					doctorService.runSetupScript = () => Promise.resolve();
				});
				it("should install nativescript-cloud extension when cloud builds option is selected", async () => {
					let index = 0;
					let isPromptForChoiceCalled = false;
					const prompter = testInjector.resolve("prompter");
					prompter.promptForChoice = () => {
						if (index === 0) {
							index++;
							return PlatformEnvironmentRequirements.SETUP_SCRIPT_OPTION_NAME;
						}

						isPromptForChoiceCalled = true;
						return PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME;
					};

					let isInstallExtensionCalled = false;
					const extensibilityService = testInjector.resolve("extensibilityService");
					extensibilityService.installExtension = () => isInstallExtensionCalled = true;

					await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements(data), cloudBuildsErrorMessage);
					assert.isTrue(isInstallExtensionCalled);
					assert.isTrue(isPromptForChoiceCalled);
				});
				it("should fail when manually setup option is selected", async () => {
					let index = 0;
					let isPromptForChoiceCalled = false;
					const prompter = testInjector.resolve("prompter");
					prompter.promptForChoice = () => {
						if (index === 0) {
							index++;
							return PlatformEnvironmentRequirements.SETUP_SCRIPT_OPTION_NAME;
						}

						isPromptForChoiceCalled = true;
						return PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME;
					};

					await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements(data), getManuallySetupErrorMessage(testInjector));
					assert.isTrue(isPromptForChoiceCalled);
				});
			});
		});

		describe("when cloud builds option is selected", () => {
			it("should install nativescript-cloud extension when cloud builds option is selected", async () => {
				const doctorService = testInjector.resolve("doctorService");
				doctorService.canExecuteLocalBuild = () => false;

				const prompter = testInjector.resolve("prompter");
				prompter.promptForChoice = () => Promise.resolve(PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME);

				let isInstallExtensionCalled = false;
				const extensibilityService = testInjector.resolve("extensibilityService");
				extensibilityService.installExtension = () => isInstallExtensionCalled = true;

				await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements(data), cloudBuildsErrorMessage);
				assert.isTrue(isInstallExtensionCalled);
			});
		});

		describe("when manually setup option is selected", () => {
			it("should fail when manually setup option is selected", async () => {
				const doctorService = testInjector.resolve("doctorService");
				doctorService.canExecuteLocalBuild = () => false;

				const prompter = testInjector.resolve("prompter");
				prompter.promptForChoice = () => PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME;

				await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements(data), getManuallySetupErrorMessage(testInjector));
			});
		});
	});
});
