import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";
const nodeArgs = require(path.join(__dirname, "..", "lib", "common", "scripts", "node-args")).getNodeArgs();

describe("nativescript-cli-lib", () => {
	it("is main entry of the package", () => {
		const packageJsonContent = fs.readFileSync(path.join(__dirname, "..", "package.json")).toString();
		const jsonContent = JSON.parse(packageJsonContent);
		const expectedEntryPoint = "./lib/nativescript-cli-lib.js";
		assert.deepEqual(jsonContent.main, expectedEntryPoint);
	});

	const publicApi: any = {
		settingsService: ["setSettings"],
		deviceEmitter: null,
		projectService: ["createProject", "isValidNativeScriptProject"],
		projectDataService: ["getProjectData", "getProjectDataFromContent"],
		localBuildService: ["build"],
		deviceLogProvider: null,
		npm: ["install", "uninstall", "view", "search"],
		extensibilityService: ["loadExtensions", "loadExtension", "getInstalledExtensions", "installExtension", "uninstallExtension"],
		liveSyncService: ["liveSync", "stopLiveSync", "enableDebugging", "disableDebugging", "attachDebugger"],
		debugService: ["debug"],
		analyticsSettingsService: ["getClientId"],
		devicesService: [
			"addDeviceDiscovery",
			"deployOnDevices",
			"getDebuggableApps",
			"getDebuggableViews",
			"getDevices",
			"getInstalledApplications",
			"initialize",
			"isAppInstalledOnDevices",
			"isCompanionAppInstalledOnDevices",
			"mapAbstractToTcpPort",
			"setLogLevel"
		]
	};

	const pathToEntryPoint = path.join(__dirname, "..", "lib", "nativescript-cli-lib.js").replace(/\\/g, "\\\\");

	_.each(publicApi, (methods: string[], moduleName: string) => {

		it(`resolves publicly available module - ${moduleName}${methods && methods.length ? " and its publicly available methods: " + methods.join(", ") : ""}`, () => {
			// HACK: If we try to require the entry point directly, the below code will fail as mocha requires all test files before starting the tests.
			// When the files are required, $injector.register adds each dependency to $injector's cache.
			// For example $injector.register("errors", Errors) will add the errors module with its resolver (Errors) to $injector's cache.
			// Calling $injector.require("errors", <path to errors file>), that's executed in our bootstrap, will fail, as the module errors is already in the cache.
			// In order to workaround this problem, start new process and assert there. This way all files will not be required in it and $injector.require(...) will work correctly.
			let testMethod = `"${process.execPath}" ${nodeArgs.join(" ")} -e "` +
				"var assert = require('chai').assert;" +
				`var result = require('${pathToEntryPoint}');` +
				`assert.ok(result.${moduleName});`;

			_.each(methods, method => {
				testMethod += `assert.ok(result.${moduleName}.${method});`;
			});

			testMethod += '"'; // Really important - close the " of node -e ""

			childProcess.execSync(testMethod);
		});

	});
});
