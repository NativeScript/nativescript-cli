import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { PostInstallCliCommand } from "../../lib/commands/post-install";
import { SettingsService } from "../../lib/common/test/unit-tests/stubs";

const createTestInjector = (): IInjector => {
	const testInjector = new Yok();
	testInjector.register("fs", {
		setCurrentUserAsOwner: async (path: string, owner: string): Promise<void> => undefined
	});

	testInjector.register("subscriptionService", {
		subscribeForNewsletter: async (): Promise<void> => undefined
	});

	testInjector.register("staticConfig", {});

	testInjector.register("commandsService", {
		tryExecuteCommand: async (commandName: string, commandArguments: string[]): Promise<void> => undefined
	});

	testInjector.register("helpService", {
		generateHtmlPages: async (): Promise<void> => undefined
	});

	testInjector.register("options", {});

	testInjector.register("doctorService", {
		printWarnings: async (): Promise<boolean> => undefined
	});

	testInjector.register("analyticsService", {
		checkConsent: async (): Promise<void> => undefined,
		track: async (featureName: string, featureValue: string): Promise<void> => undefined
	});

	testInjector.register("logger", {
		out: (formatStr?: any, ...args: any[]): void => undefined,
		printMarkdown: (...args: any[]): void => undefined
	});

	testInjector.register("settingsService", SettingsService);

	testInjector.registerCommand("post-install-cli", PostInstallCliCommand);

	testInjector.register("hostInfo", {});

	return testInjector;
};

describe("post-install command", () => {
	const originalNpmArgv = process.env.npm_config_argv;
	const originalSudoUser = process.env.SUDO_USER;

	afterEach(() => {
		process.env.npm_config_argv = originalNpmArgv;
		process.env.SUDO_USER = originalSudoUser;
	});

	it("calls subscriptionService.subscribeForNewsletter method", async () => {
		const testInjector = createTestInjector();
		const subscriptionService = testInjector.resolve<ISubscriptionService>("subscriptionService");
		let isSubscribeForNewsletterCalled = false;
		subscriptionService.subscribeForNewsletter = async (): Promise<void> => {
			isSubscribeForNewsletterCalled = true;
		};
		const postInstallCommand = testInjector.resolveCommand("post-install-cli");

		await postInstallCommand.execute([]);
		assert.isTrue(isSubscribeForNewsletterCalled, "post-install-cli command must call subscriptionService.subscribeForNewsletter");
	});

	const verifyResult = async (opts: { shouldCallMethod: boolean }): Promise<void> => {
		const testInjector = createTestInjector();
		const subscriptionService = testInjector.resolve<ISubscriptionService>("subscriptionService");
		let isSubscribeForNewsletterCalled = false;
		subscriptionService.subscribeForNewsletter = async (): Promise<void> => {
			isSubscribeForNewsletterCalled = true;
		};

		const helpService = testInjector.resolve<IHelpService>("helpService");
		let isGenerateHtmlPagesCalled = false;
		helpService.generateHtmlPages = async (): Promise<void> => {
			isGenerateHtmlPagesCalled = true;
		};

		const analyticsService = testInjector.resolve<IAnalyticsService>("analyticsService");
		let isCheckConsentCalled = false;
		analyticsService.checkConsent = async (): Promise<void> => {
			isCheckConsentCalled = true;
		};

		const commandsService = testInjector.resolve<ICommandsService>("commandsService");
		let isTryExecuteCommandCalled = false;
		commandsService.tryExecuteCommand = async (): Promise<void> => {
			isTryExecuteCommandCalled = true;
		};

		const postInstallCommand = testInjector.resolveCommand("post-install-cli");
		await postInstallCommand.execute([]);

		process.env.npm_config_argv = originalNpmArgv;
		process.env.SUDO_USER = originalSudoUser;

		const hasNotInMsg = opts.shouldCallMethod ? "" : "NOT";

		assert.equal(isSubscribeForNewsletterCalled, opts.shouldCallMethod, `post-install-cli command must ${hasNotInMsg} call subscriptionService.subscribeForNewsletter`);
		assert.equal(isGenerateHtmlPagesCalled, opts.shouldCallMethod, `post-install-cli command must ${hasNotInMsg} call helpService.generateHtmlPages`);
		assert.equal(isCheckConsentCalled, opts.shouldCallMethod, `post-install-cli command must ${hasNotInMsg} call analyticsService.checkConsent`);
		assert.equal(isTryExecuteCommandCalled, opts.shouldCallMethod, `post-install-cli command must ${hasNotInMsg} call commandsService.tryExecuteCommand`);
	};

	it("does not call specific methods when CLI is installed with sudo without `--unsafe-perm`", () => {
		process.env.npm_config_argv = JSON.stringify({});
		process.env.SUDO_USER = "user1";
		return verifyResult({ shouldCallMethod: false });
	});

	it("calls specific methods when CLI is installed with sudo with `--unsafe-perm`", async () => {
		process.env.npm_config_argv = JSON.stringify({ original: ["--unsafe-perm"] });
		process.env.SUDO_USER = "user1";
		return verifyResult({ shouldCallMethod: true });
	});

	it("calls specific methods when CLI is installed without sudo", async () => {
		process.env.npm_config_argv = JSON.stringify({});
		delete process.env.SUDO_USER;
		return verifyResult({ shouldCallMethod: true });
	});
});
