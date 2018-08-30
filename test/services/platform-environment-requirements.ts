import { Yok } from "../../lib/common/yok";
import { PlatformEnvironmentRequirements } from '../../lib/services/platform-environment-requirements';
import * as stubs from "../stubs";
import { assert } from "chai";
import { EOL } from "os";

const platform = "android";
const cloudBuildsErrorMessage = `In order to test your application use the $ tns login command to log in with your account and then $ tns cloud build command to build your app in the cloud.`;
const manuallySetupErrorMessage = `To be able to build for ${platform}, verify that your environment is configured according to the system requirements described at `;
const nonInteractiveConsoleMessageWhenExtensionIsNotInstalled = `You are missing the nativescript-cloud extension and you will not be able to execute cloud builds. Your environment is not configured properly and you will not be able to execute local builds. To continue, choose one of the following options:  ${EOL}Run $ tns preview command to enjoy NativeScript without any local setup.${EOL}Run $ tns setup command to run the setup script to try to automatically configure your environment for local builds.${EOL}Run $ tns cloud setup command to install the nativescript-cloud extension to configure your environment for cloud builds.${EOL}Verify that your environment is configured according to the system requirements described at `;
const nonInteractiveConsoleMessageWhenExtensionIsInstalled = `Your environment is not configured properly and you will not be able to execute local builds. To continue, choose one of the following options: ${EOL}Run $ tns preview command to enjoy NativeScript without any local setup.${EOL}Run $ tns setup command to run the setup script to try to automatically configure your environment for local builds.${EOL}In order to test your application use the $ tns login command to log in with your account and then $ tns cloud build command to build your app in the cloud.${EOL}Verify that your environment is configured according to the system requirements described at .`;

function createTestInjector() {
	const testInjector = new Yok();

	testInjector.register("analyticsService", {
		trackEventActionInGoogleAnalytics: () => ({})
	});
	testInjector.register("commandsService", {currentCommandData: {commandName: "test", commandArguments: [""]}});
	testInjector.register("doctorService", {});
	testInjector.register("errors", {
		fail: (err: any) => {
			throw new Error(err.formatStr || err.message || err);
		}
	});
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("prompter", {});
	testInjector.register("platformEnvironmentRequirements", PlatformEnvironmentRequirements);
	testInjector.register("staticConfig", { SYS_REQUIREMENTS_LINK: "" });
	testInjector.register("nativeScriptCloudExtensionService", {});

	return testInjector;
}

describe("platformEnvironmentRequirements ", () => {
	describe("checkRequirements", () => {
		let testInjector: IInjector = null;
		let platformEnvironmentRequirements: IPlatformEnvironmentRequirements = null;
		let promptForChoiceData: {message: string, choices: string[]}[] = [];
		let isExtensionInstallCalled = false;

		function mockDoctorService(data: {canExecuteLocalBuild: boolean, mockSetupScript?: boolean}) {
			const doctorService = testInjector.resolve("doctorService");
			doctorService.canExecuteLocalBuild = () => data.canExecuteLocalBuild;
			if (data.mockSetupScript) {
				doctorService.runSetupScript = () => Promise.resolve();
			}
		}

		function mockPrompter(data: {firstCallOptionName: string, secondCallOptionName?: string}) {
			const prompter = testInjector.resolve("prompter");
			prompter.promptForChoice = (message: string, choices: string[]) => {
				promptForChoiceData.push({message: message, choices: choices});

				if (promptForChoiceData.length === 1) {
					return Promise.resolve(data.firstCallOptionName);
				}

				if (data.secondCallOptionName) {
					return Promise.resolve(data.secondCallOptionName);
				}
			};
		}

		function mockNativeScriptCloudExtensionService(data: {isInstalled: boolean}) {
			const nativeScriptCloudExtensionService = testInjector.resolve("nativeScriptCloudExtensionService");
			nativeScriptCloudExtensionService.isInstalled = () => data.isInstalled;
			nativeScriptCloudExtensionService.install = () => { isExtensionInstallCalled = true; };
		}

		beforeEach(() => {
			testInjector = createTestInjector();
			platformEnvironmentRequirements = testInjector.resolve("platformEnvironmentRequirements");
			process.stdout.isTTY = true;
			process.stdin.isTTY = true;
		});

		afterEach(() => {
			promptForChoiceData = [];
			isExtensionInstallCalled = false;
			delete process.env.NS_SKIP_ENV_CHECK;
		});

		it("should return true when environment is configured", async () => {
			mockDoctorService({ canExecuteLocalBuild: true });
			const result = await platformEnvironmentRequirements.checkEnvironmentRequirements({ platform });
			assert.isTrue(result.canExecute);
			assert.isTrue(promptForChoiceData.length === 0);
		});
		it("should show prompt when environment is not configured and nativescript-cloud extension is not installed", async () => {
			mockDoctorService({ canExecuteLocalBuild: false });
			mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME });
			mockNativeScriptCloudExtensionService({ isInstalled: false });

			await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }));
			assert.isTrue(promptForChoiceData.length === 1);
			assert.isTrue(isExtensionInstallCalled);
			assert.deepEqual("To continue, choose one of the following options: ", promptForChoiceData[0].message);
			assert.deepEqual(['Sync to Playground', 'Configure for Cloud Builds', 'Configure for Local Builds', 'Configure for Both Local and Cloud Builds', 'Skip Step and Configure Manually'], promptForChoiceData[0].choices);
		});
		it("should show prompt when environment is not configured and nativescript-cloud extension is installed", async () => {
			mockDoctorService({ canExecuteLocalBuild: false });
			mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME });
			mockNativeScriptCloudExtensionService({ isInstalled: true });

			await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }));
			assert.isTrue(promptForChoiceData.length === 1);
			assert.deepEqual("To continue, choose one of the following options: ", promptForChoiceData[0].message);
			assert.deepEqual(['Sync to Playground', 'Try Cloud Operation', 'Configure for Local Builds', 'Skip Step and Configure Manually'], promptForChoiceData[0].choices);
		});
		it("should not show 'Sync to Playground' option when hideSyncToPreviewAppOption is provided", async () => {
			mockDoctorService({ canExecuteLocalBuild: false });
			mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME });
			mockNativeScriptCloudExtensionService({ isInstalled: true });

			await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform, notConfiguredEnvOptions: { hideSyncToPreviewAppOption: true }}));
			assert.isTrue(promptForChoiceData.length === 1);
			assert.isTrue(isExtensionInstallCalled);
			assert.deepEqual("To continue, choose one of the following options: ", promptForChoiceData[0].message);
			assert.deepEqual(['Try Cloud Operation', 'Configure for Local Builds', 'Skip Step and Configure Manually'], promptForChoiceData[0].choices);
		});
		it("should not show 'Try Cloud Build' option when hideCloudBuildOption is provided", async () => {
			mockDoctorService({ canExecuteLocalBuild: false });
			mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME });
			mockNativeScriptCloudExtensionService({ isInstalled: true });

			await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform, notConfiguredEnvOptions: { hideCloudBuildOption: true }}));
			assert.isTrue(promptForChoiceData.length === 1);
			assert.isTrue(isExtensionInstallCalled);
			assert.deepEqual("To continue, choose one of the following options: ", promptForChoiceData[0].message);
			assert.deepEqual(['Sync to Playground', 'Configure for Local Builds', 'Skip Step and Configure Manually'], promptForChoiceData[0].choices);
		});
		it("should skip env check when NS_SKIP_ENV_CHECK environment variable is passed", async() => {
			process.env.NS_SKIP_ENV_CHECK = true;

			const output = await platformEnvironmentRequirements.checkEnvironmentRequirements({ platform });

			assert.isTrue(output.canExecute);
			assert.isFalse(isExtensionInstallCalled);
			assert.isTrue(promptForChoiceData.length === 0);
		});

		describe("when local setup option is selected", () => {
			beforeEach(() => {
				mockPrompter( {firstCallOptionName: PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME});
			});

			it("should return true when env is configured after executing setup script", async () => {
				const doctorService = testInjector.resolve("doctorService");
				doctorService.canExecuteLocalBuild = () => false;
				doctorService.runSetupScript = async () => { doctorService.canExecuteLocalBuild = () => true; };

				mockNativeScriptCloudExtensionService({ isInstalled: null });

				const output = await platformEnvironmentRequirements.checkEnvironmentRequirements({ platform });
				assert.isTrue(output.canExecute);
			});

			describe("and env is not configured after executing setup script", () => {
				it("should setup manually when cloud extension is installed", async () => {
					mockDoctorService( { canExecuteLocalBuild: false, mockSetupScript: true });
					mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME, secondCallOptionName: PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME });
					mockNativeScriptCloudExtensionService({ isInstalled: true });

					await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }), manuallySetupErrorMessage);
				});
				describe("and cloud extension is not installed", () => {
					beforeEach(() => {
						mockDoctorService({ canExecuteLocalBuild: false, mockSetupScript: true });
						mockNativeScriptCloudExtensionService({ isInstalled: false });
					});
					it("should list 2 posibile options to select", async () => {
						mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME });

						await platformEnvironmentRequirements.checkEnvironmentRequirements({ platform });
						assert.deepEqual(promptForChoiceData[1].choices, ['Configure for Cloud Builds', 'Skip Step and Configure Manually']);
					});
					it("should install nativescript-cloud extension when 'Configure for Cloud Builds' option is selected", async () => {
						mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME, secondCallOptionName: PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME });

						await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }), cloudBuildsErrorMessage);
						assert.deepEqual(isExtensionInstallCalled, true);
					});
					it("should setup manually when 'Skip Step and Configure Manually' option is selected", async () => {
						mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME, secondCallOptionName: PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME });
						await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }), manuallySetupErrorMessage);
					});
				});
			});
		});

		describe("when cloud setup option is selected", () => {
			beforeEach(() => {
				mockDoctorService({ canExecuteLocalBuild: false });
				mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME });
			});

			it("should install nativescript-cloud extension when it is not installed", async () => {
				mockNativeScriptCloudExtensionService({ isInstalled: false });
				await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }), cloudBuildsErrorMessage);
				assert.isTrue(isExtensionInstallCalled);
			});
		});

		describe("when manually setup option is selected", () => {
			beforeEach(() => {
				mockDoctorService({ canExecuteLocalBuild: false });
				mockPrompter({ firstCallOptionName: PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME });
			});

			it("should fail when nativescript-cloud extension is installed", async () => {
				mockNativeScriptCloudExtensionService({ isInstalled: true });
				await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }), manuallySetupErrorMessage);
			});
			it("should fail when nativescript-cloud extension is not installed", async () => {
				mockNativeScriptCloudExtensionService({ isInstalled: false });
				await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }), manuallySetupErrorMessage);
			});
		});

		describe("when console is non interactive", () => {
			beforeEach(() => {
				process.stdout.isTTY = false;
				process.stdin.isTTY = false;
				mockDoctorService({ canExecuteLocalBuild: false });
			});

			it("should fail when nativescript-cloud extension is installed", async () => {
				mockNativeScriptCloudExtensionService({ isInstalled: true });
				await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }), nonInteractiveConsoleMessageWhenExtensionIsInstalled);
			});
			it("should fail when nativescript-cloud extension is not installed", async () => {
				mockNativeScriptCloudExtensionService({ isInstalled: false });
				await assert.isRejected(platformEnvironmentRequirements.checkEnvironmentRequirements({ platform }), nonInteractiveConsoleMessageWhenExtensionIsNotInstalled);
			});
		});
	});
});
