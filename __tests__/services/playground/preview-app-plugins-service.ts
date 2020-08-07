import { Yok } from "../../../src/common/yok";
import { PreviewAppPluginsService } from "../../../src/services/livesync/playground/preview-app-plugins-service";
import { Device } from "nativescript-preview-sdk";
import { assert } from "chai";
import * as util from "util";
import { PluginComparisonMessages } from "../../../src/services/livesync/playground/preview-app-constants";
import { ErrorsStub, PackageInstallationManagerStub } from "../../stubs";
import { IStringDictionary } from "../../../src/common/declarations";
import { IInjector } from "../../../src/common/definitions/yok";
import * as _ from "lodash";

let readJsonParams: string[] = [];
let warnParams: string[] = [];

const deviceId = "myTestDeviceId";
const projectDir = "testProjectDir";

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
		warn: (message: string, opts: any) => {
			if (!opts || !opts.wrapMessageWithBorders) {
				warnParams.push(message);
			}
		}
	});

	injector.register("packageInstallationManager", PackageInstallationManagerStub);
	injector.register("errors", ErrorsStub);
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
		pluginsExpanded: false,
		uniqueId: "testId"
	};
}

function createPreviewLiveSyncData(options?: { bundle: boolean }) {
	return {
		projectDir,
		release: false,
		bundle: options.bundle,
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
