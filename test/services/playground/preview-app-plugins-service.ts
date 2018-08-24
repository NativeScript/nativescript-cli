import { Yok } from "../../../lib/common/yok";
import { PreviewAppPluginsService } from "../../../lib/services/livesync/playground/preview-app-plugins-service";
import { Device } from "nativescript-preview-sdk";
import { assert } from "chai";

let readJsonParams: string[] = [];
let warnParams: string[] = [];

function createTestInjector(localPlugins: IStringDictionary): IInjector {
	const injector = new Yok();
	injector.register("fs", {
		readJson: (filePath: string) => {
			readJsonParams.push(filePath);
			return {
				dependencies: localPlugins
			};
		}
	});
	injector.register("logger", {
		trace: () => ({}),
		warn: (message: string) =>  warnParams.push(message)
	});
	injector.register("projectData", {
		projectDir: "testProjectDir"
	});
	injector.register("previewAppPluginsService", PreviewAppPluginsService);
	return injector;
}

function createDevice(plugins: string): Device {
	return  {
		id: "myTestDeviceId",
		platform: "iOS",
		model: "myTestDeviceModel",
		name: "myTestDeviceName",
		osVersion: "10.0",
		previewAppVersion: "28.0",
		runtimeVersion: "4.3.0",
		plugins,
		pluginsExpanded: false
	};
}

function setup(localPlugins: IStringDictionary, previewAppPlugins: IStringDictionary): any {
	const injector = createTestInjector(localPlugins);
	const previewAppPluginsService = injector.resolve("previewAppPluginsService");
	const device = createDevice(JSON.stringify(previewAppPlugins));

	return {
		previewAppPluginsService,
		device
	};
}

describe.only("previewAppPluginsService", () => {
	describe("comparePluginsOnDevice", () => {
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
					"Plugin nativescript-facebook is not included in preview app and will not work."
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
					"Plugin nativescript-facebook is not included in preview app and will not work.",
					"Plugin nativescript-theme-core is not included in preview app and will not work.",
					"Plugin tns-core-modules is not included in preview app and will not work."
				]
			},
			{
				name: "should show warning for plugin which local version is greater than preview app's version",
				localPlugins: {
					"nativescript-theme-core": "1.1.4"
				},
				previewAppPlugins: {
					"nativescript-theme-core": "1.0.4"
				},
				expectedWarnings: [
					"Plugin nativescript-theme-core has local version 1.1.4 but preview app has version 1.0.4. Some functionalities may not work."
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
			}
		];

		afterEach(() => {
			warnParams = [];
			readJsonParams = [];
		});

		for (const testCase of testCases) {
			it(`${testCase.name}`, async () => {
				const { previewAppPluginsService, device } = setup(testCase.localPlugins, testCase.previewAppPlugins);

				await previewAppPluginsService.comparePluginsOnDevice(device);

				assert.equal(warnParams.length, testCase.expectedWarnings.length);
				testCase.expectedWarnings.forEach(warning => assert.include(warnParams, warning));
			});
		}
	});
});
