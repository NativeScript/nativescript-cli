import { assert } from "chai";
import { Yok } from "../../yok";
import { PreUninstallCommand } from "../../commands/preuninstall";
import * as path from "path";
const helpers = require("../../helpers");

describe("preuninstall", () => {
	const profileDir = "profileDir";
	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();

		testInjector.register("extensibilityService", {
			removeAllExtensions: (): void => undefined
		});

		testInjector.register("fs", {
			deleteFile: (pathToFile: string): void => undefined
		});

		testInjector.register("packageInstallationManager", {
			clearInspectorCache: (): void => undefined
		});

		testInjector.register("settingsService", {
			getProfileDir: (): string => profileDir
		});

		testInjector.register("opener", {
			open: (filename: string, appname?: string): void => undefined
		});

		testInjector.register("analyticsService", {
			trackEventActionInGoogleAnalytics: async (data: IEventActionData): Promise<void> => undefined,
			finishTracking: async(): Promise<void> => undefined
		});

		testInjector.registerCommand("dev-preuninstall", PreUninstallCommand);

		return testInjector;
	};

	it("cleans the KillSwitches/cli file", async () => {
		helpers.doesCurrentNpmCommandMatch = () => false;
		const testInjector = createTestInjector();
		const fs = testInjector.resolve<IFileSystem>("fs");
		const deletedFiles: string[] = [];
		fs.deleteFile = (pathToFile: string) => {
			deletedFiles.push(pathToFile);
		};

		const preUninstallCommand: ICommand = testInjector.resolveCommand("dev-preuninstall");
		await preUninstallCommand.execute([]);
		assert.deepEqual(deletedFiles, [path.join(profileDir, "KillSwitches", "cli")]);
	});

	it("tracks correct data in analytics", async () => {
		const testData: { isInteractive: boolean, isIntentionalUninstall: boolean, expecteEventLabelData: string }[] = [
			{
				isIntentionalUninstall: false,
				isInteractive: false,
				expecteEventLabelData: `isIntentionalUninstall__false__isInteractive__false`
			},
			{
				isIntentionalUninstall: true,
				isInteractive: false,
				expecteEventLabelData: `isIntentionalUninstall__true__isInteractive__false`
			},
			{
				isIntentionalUninstall: false,
				isInteractive: true,
				expecteEventLabelData: `isIntentionalUninstall__false__isInteractive__true`
			},
			{
				isIntentionalUninstall: true,
				isInteractive: true,
				expecteEventLabelData: `isIntentionalUninstall__true__isInteractive__true`
			}
		];

		const testInjector = createTestInjector();
		const analyticsService = testInjector.resolve<IAnalyticsService>("analyticsService");
		let trackedData: IEventActionData[] = [];
		analyticsService.trackEventActionInGoogleAnalytics = async (data: IEventActionData): Promise<void> => {
			trackedData.push(data);
		};

		let isFinishTrackingCalled = false;
		analyticsService.finishTracking = async (): Promise<void> => {
			isFinishTrackingCalled = true;
		};

		const preUninstallCommand: ICommand = testInjector.resolveCommand("dev-preuninstall");
		for (const testCase of testData) {
			helpers.isInteractive = () => testCase.isInteractive;
			helpers.doesCurrentNpmCommandMatch = () => testCase.isIntentionalUninstall;
			isFinishTrackingCalled = false;
			await preUninstallCommand.execute([]);
			assert.deepEqual(trackedData, [{
				action: "Uninstall CLI",
				additionalData: testCase.expecteEventLabelData
			}]);
			assert.isTrue(isFinishTrackingCalled, "At the end of the command, finishTracking must be called");
			trackedData = [];
		}
	});

	it("removes all extensions and inspector cache when uninstall command is executed", async () => {
		helpers.doesCurrentNpmCommandMatch = () => true;
		helpers.isInteractive = () => false;

		const testInjector = createTestInjector();
		const fs = testInjector.resolve<IFileSystem>("fs");
		const deletedFiles: string[] = [];
		fs.deleteFile = (pathToFile: string) => {
			deletedFiles.push(pathToFile);
		};

		const extensibilityService = testInjector.resolve<IExtensibilityService>("extensibilityService");
		let isRemoveAllExtensionsCalled = false;
		extensibilityService.removeAllExtensions = () => {
			isRemoveAllExtensionsCalled = true;
		};

		const packageInstallationManager = testInjector.resolve<IPackageInstallationManager>("packageInstallationManager");
		let isClearInspectorCacheCalled = false;
		packageInstallationManager.clearInspectorCache = () => {
			isClearInspectorCacheCalled = true;
		};

		const preUninstallCommand: ICommand = testInjector.resolveCommand("dev-preuninstall");
		await preUninstallCommand.execute([]);
		assert.deepEqual(deletedFiles, [path.join(profileDir, "KillSwitches", "cli")]);

		assert.isTrue(isRemoveAllExtensionsCalled, "When uninstall is called, `removeAllExtensions` method must be called");
		assert.isTrue(isClearInspectorCacheCalled, "When uninstall is called, `clearInspectorCache` method must be called");
	});

	// disabled (6/24/2020)
	// it("opens the uninstall feedback form when terminal is interactive and uninstall is called", async () => {
	// 	helpers.doesCurrentNpmCommandMatch = () => true;
	// 	helpers.isInteractive = () => true;

	// 	const testInjector = createTestInjector();
	// 	const opener = testInjector.resolve<IOpener>("opener");
	// 	const openParams: any[] = [];
	// 	opener.open = (filename: string, appname?: string) => {
	// 		openParams.push({ filename, appname });
	// 	};

	// 	const preUninstallCommand: ICommand = testInjector.resolveCommand("dev-preuninstall");
	// 	await preUninstallCommand.execute([]);
	// 	assert.deepEqual(openParams, [{ filename: "https://www.nativescript.org/uninstall-feedback", appname: undefined }]);
	// });
});
