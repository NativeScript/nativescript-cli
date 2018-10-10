import { Yok } from "../../../lib/common/yok";
import { PreviewAppPluginsService } from "../../../lib/services/livesync/playground/preview-app-plugins-service";
import { Device } from "nativescript-preview-sdk";
import { assert } from "chai";
import * as util from "util";
import { PluginComparisonMessages } from "../../../lib/services/livesync/playground/preview-app-constants";

let readJsonParams: string[] = [];
let warnParams: string[] = [];

const deviceId = "myTestDeviceId";
const projectDir =  "testProjectDir";

function createTestInjector(localPlugins: IStringDictionary, options?: { isNativeScriptPlugin?: boolean, hasPluginNativeCode?: boolean }): IInjector {
	options = options || {};
	const injector = new Yok();
	injector.register("fs", {
		readJson: (filePath: string) => {
			readJsonParams.push(filePath);
			const result: any = {
				dependencies: localPlugins
			};

			if (options.isNativeScriptPlugin) {
				result.nativescript = {};
			}

			return result;
		},
		exists: (filePath: string) => {
			return options.hasPluginNativeCode;
		},
		isEmptyDir: (filePath: string) => {
			return !options.hasPluginNativeCode;
		}
	});
	injector.register("pluginsService", {
		isNativeScriptPlugin: () => {
			return options.isNativeScriptPlugin;
		}
	});
	injector.register("logger", {
		trace: () => ({}),
		warn: (message: string) =>  warnParams.push(message)
	});
	injector.register("previewAppPluginsService", PreviewAppPluginsService);
	return injector;
}

function createDevice(plugins: string): Device {
	return {
		id: deviceId,
		platform: "iOS",
		model: "myTestDeviceModel",
		name: "myTestDeviceName",
		osVersion: "10.0",
		previewAppVersion: "28.0.0",
		runtimeVersion: "4.3.0",
		plugins,
		pluginsExpanded: false
	};
}

function createPreviewLiveSyncData(options?: { bundle: boolean }) {
	return {
		projectDir,
		appFilesUpdaterOptions: {
			release: false,
			bundle: options.bundle
		},
		env: {}
	};
}

function setup(localPlugins: IStringDictionary, previewAppPlugins: IStringDictionary,
	options?: { isNativeScriptPlugin: boolean, hasPluginNativeCode: boolean }): any {
	const injector = createTestInjector(localPlugins, options);
	const previewAppPluginsService = injector.resolve("previewAppPluginsService");
	const device = createDevice(JSON.stringify(previewAppPlugins));

	return {
		previewAppPluginsService,
		device
	};
}

describe("previewAppPluginsService", () => {
	describe("comparePluginsOnDevice without bundle", () => {
		it("should persist warnings per preview app's version", async () => {
			const localPlugins = {
				"nativescript-facebook": "2.2.3",
				"nativescript-theme-core": "1.0.4",
				"tns-core-modules": "4.2.0"
			};
			const previewAppPlugins = {
				"nativescript-theme-core": "2.0.4",
				"tns-core-modules": "4.2.0"
			};
			const injector = createTestInjector(localPlugins);
			const previewAppPluginsService = injector.resolve("previewAppPluginsService");

			let isGetDevicePluginsCalled = false;
			const originalGetDevicePlugins = (<any>previewAppPluginsService).getDevicePlugins;
			(<any>previewAppPluginsService).getDevicePlugins = (device: Device) => {
				isGetDevicePluginsCalled = true;
				return originalGetDevicePlugins(device);
			};
			let isGetLocalPluginsCalled = false;
			const originalGetLocalPlugins = (<any>previewAppPluginsService).getLocalPlugins;
			(<any>previewAppPluginsService).getLocalPlugins = () => {
				isGetLocalPluginsCalled = true;
				return originalGetLocalPlugins.apply(previewAppPluginsService, [projectDir]);
			};

			const previewLiveSyncData = createPreviewLiveSyncData({ bundle: false });

			await previewAppPluginsService.comparePluginsOnDevice(previewLiveSyncData, createDevice(JSON.stringify(previewAppPlugins)));

			const expectedWarnings = [
				util.format(PluginComparisonMessages.PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP, "nativescript-facebook", deviceId),
				util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_DIFFERENCE_IN_MAJOR_VERSION, "nativescript-theme-core", "1.0.4", "2.0.4")
			];
			assert.isTrue(isGetDevicePluginsCalled);
			assert.isTrue(isGetLocalPluginsCalled);
			assert.deepEqual(warnParams, expectedWarnings);

			isGetDevicePluginsCalled = false;
			isGetLocalPluginsCalled = false;
			warnParams = [];

			await previewAppPluginsService.comparePluginsOnDevice(previewLiveSyncData, createDevice(JSON.stringify(previewAppPlugins)));

			assert.isFalse(isGetDevicePluginsCalled);
			assert.isFalse(isGetLocalPluginsCalled);
			assert.deepEqual(warnParams, expectedWarnings);
		});

		const testCases = [
			{
				name: "should show warning for plugin not included in preview app",
				localPlugins: {
					"nativescript-facebook": "2.2.3",
					"nativescript-theme-core": "~1.0.4",
					"tns-core-modules": "~4.2.0"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "~1.0.4",
					"tns-core-modules": "~4.2.0"
				},
				expectedWarnings: [
					util.format(PluginComparisonMessages.PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP, "nativescript-facebook", deviceId)
				]
			},
			{
				name: "should show warnings for plugins not included in preview app",
				localPlugins: {
					"nativescript-facebook": "2.2.3",
					"nativescript-theme-core": "~1.0.4",
					"tns-core-modules": "~4.2.0"
				},
				previewAppPlugins: {
				},
				expectedWarnings: [
					util.format(PluginComparisonMessages.PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP, "nativescript-facebook", deviceId),
					util.format(PluginComparisonMessages.PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP, "nativescript-theme-core", deviceId),
					util.format(PluginComparisonMessages.PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP, "tns-core-modules", deviceId)
				]
			},
			{
				name: "should not show warnings when all plugins are included in preview app",
				localPlugins: {
					"nativescript-theme-core": "1.0.4",
					"nativescript-facebook": "2.2.3"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "1.1.4",
					"nativescript-facebook": "2.2.3"
				},
				expectedWarnings: <string[]>[]
			},
			{
				name: "should show warning when local plugin has lower major version",
				localPlugins: {
					"nativescript-theme-core": "2.0.0"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "3.4.0"
				},
				expectedWarnings: [
					util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_DIFFERENCE_IN_MAJOR_VERSION, "nativescript-theme-core", "2.0.0", "3.4.0")
				]
			},
			{
				name: "should show warning when local plugin has greater major version",
				localPlugins: {
					"nativescript-theme-core": "4.0.0"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "3.0.0"
				},
				expectedWarnings: [
					util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_DIFFERENCE_IN_MAJOR_VERSION, "nativescript-theme-core", "4.0.0", "3.0.0")
				]
			},
			{
				name: "should show warning when local plugin has greater minor version and the same major version",
				localPlugins: {
					"nativescript-theme-core": "3.5.0"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "3.0.0"
				},
				expectedWarnings: [
					util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_GREATHER_MINOR_VERSION, "nativescript-theme-core", "3.5.0", "3.0.0")
				]
			},
			{
				name: "should not show warning when local plugin has lower minor version and the same major version",
				localPlugins: {
					"nativescript-theme-core": "3.1.0"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "3.2.0"
				},
				expectedWarnings: []
			},
			{
				name: "should not show warning when plugins differ only in patch versions (lower local patch version)",
				localPlugins: {
					"nativescript-theme-core": "3.5.0"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "3.5.1"
				},
				expectedWarnings: []
			},
			{
				name: "should not show warning when plugins differ only in patch versions (greater local patch version)",
				localPlugins: {
					"nativescript-theme-core": "3.5.1"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "3.5.0"
				},
				expectedWarnings: []
			}
		];

		afterEach(() => {
			warnParams = [];
			readJsonParams = [];
		});

		for (const testCase of testCases) {
			it(`${testCase.name}`, async () => {
				const { previewAppPluginsService, device } = setup(testCase.localPlugins, testCase.previewAppPlugins);

				await previewAppPluginsService.comparePluginsOnDevice(createPreviewLiveSyncData({ bundle: false }), device);

				assert.equal(warnParams.length, testCase.expectedWarnings.length);
				testCase.expectedWarnings.forEach(warning => assert.include(warnParams, warning));
			});
		}
	});
	describe("comparePluginsOnDevice with bundle", () => {
		const testCases = [
			{
				name: "should not show warning for non nativescript plugin that has lower major version",
				localPlugins: {
					lodash: "1.2.3"
				},
				previewAppPlugins: {
					lodash: "2.3.3"
				},
				isNativeScriptPlugin: false,
				hasPluginNativeCode: false,
				expectedWarnings: <string[]>[]
			},
			{
				name: "should not show warning for non nativescript plugin that has greather major version",
				localPlugins: {
					lodash: "3.2.3"
				},
				previewAppPlugins: {
					lodash: "2.3.3"
				},
				isNativeScriptPlugin: false,
				hasPluginNativeCode: false,
				expectedWarnings: []
			},
			{
				name: "should show warning for non nativescript plugin that has greather minor version",
				localPlugins: {
					lodash: "3.4.5"
				},
				previewAppPlugins: {
					lodash: "3.3.0"
				},
				isNativeScriptPlugin: false,
				hasPluginNativeCode: false,
				expectedWarnings: []
			},
			{
				name: "should not show warning for non nativescript plugin that has the same version",
				localPlugins: {
					lodash: "3.4.5"
				},
				previewAppPlugins: {
					lodash: "3.4.5"
				},
				isNativeScriptPlugin: false,
				hasPluginNativeCode: false,
				expectedWarnings: []
			},
			{
				name: "should not show warning for nativescript plugin without native code that has lower major version",
				localPlugins: {
					"nativescript-theme-core": "2.4.5"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "3.4.5"
				},
				isNativeScriptPlugin: true,
				hasPluginNativeCode: false,
				expectedWarnings: <string[]>[]
			},
			{
				name: "should not show warning for nativescript plugin without native code that has greather major version",
				localPlugins: {
					"nativescript-theme-core": "4.4.5"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "3.4.5"
				},
				isNativeScriptPlugin: true,
				hasPluginNativeCode: false,
				expectedWarnings: []
			},
			{
				name: "should not show warning for nativescript plugin without native code that has greather minor version",
				localPlugins: {
					"nativescript-theme-core": "4.6.5"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "4.4.5"
				},
				isNativeScriptPlugin: true,
				hasPluginNativeCode: false,
				expectedWarnings: []
			},
			{
				name: "should not show warning for nativescript plugin without native code that has the same version",
				localPlugins: {
					"nativescript-theme-core": "4.6.5"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "4.6.5"
				},
				isNativeScriptPlugin: true,
				hasPluginNativeCode: false,
				expectedWarnings: []
			},
			{
				name: "should show warning for nativescript plugin with native code that has lower major version",
				localPlugins: {
					"nativescript-theme-core": "2.4.5"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "3.4.5"
				},
				isNativeScriptPlugin: true,
				hasPluginNativeCode: true,
				expectedWarnings: [util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_DIFFERENCE_IN_MAJOR_VERSION, "nativescript-theme-core", "2.4.5", "3.4.5")]
			},
			{
				name: "should show warning for nativescript plugin with native code that has greather major version",
				localPlugins: {
					"nativescript-theme-core": "4.4.5"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "3.4.5"
				},
				isNativeScriptPlugin: true,
				hasPluginNativeCode: true,
				expectedWarnings: [util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_DIFFERENCE_IN_MAJOR_VERSION, "nativescript-theme-core", "4.4.5", "3.4.5")]
			},
			{
				name: "should show warning for nativescript plugin with native code that has greather minor version",
				localPlugins: {
					"nativescript-theme-core": "4.4.5"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "4.3.5"
				},
				isNativeScriptPlugin: true,
				hasPluginNativeCode: true,
				expectedWarnings: [util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_GREATHER_MINOR_VERSION, "nativescript-theme-core", "4.4.5", "4.3.5")]
			},
		];

		afterEach(() => {
			warnParams = [];
			readJsonParams = [];
		});

		_.each(testCases, testCase => {
			it(`${testCase.name}`, async () => {
				const { previewAppPluginsService, device } = setup(testCase.localPlugins, testCase.previewAppPlugins, { isNativeScriptPlugin: testCase.isNativeScriptPlugin, hasPluginNativeCode: testCase.hasPluginNativeCode });

				await previewAppPluginsService.comparePluginsOnDevice(createPreviewLiveSyncData({ bundle: true }), device);

				assert.equal(warnParams.length, testCase.expectedWarnings.length);
				testCase.expectedWarnings.forEach(warning => assert.include(warnParams, warning));
			});
		});
	});
	describe("getExternalPlugins", () => {
		it("should exclude `nativescript-theme-core`", () => {
			const plugins = { "nativescript-theme-core": "1.3.5" };
			const { previewAppPluginsService, device } = setup(plugins, plugins);
			const actualPlugins = previewAppPluginsService.getExternalPlugins(device);
			assert.notInclude(actualPlugins, "nativescript-theme-core");
		});
	});
});
