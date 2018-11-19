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

	return testInjector;
};

describe("post-install command", () => {
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
});
