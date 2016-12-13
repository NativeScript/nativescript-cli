import {assert} from "chai";
import {Errors} from "../lib/common/errors";
import {FileSystem} from "../lib/common/file-system";
import Future = require("fibers/future");
import {HostInfo} from "../lib/common/host-info";
import {Options} from "../lib/options";
import {PluginVariablesHelper} from "../lib/common/plugin-variables-helper";
import {PluginVariablesService} from "../lib/services/plugin-variables-service";
import {ProjectData} from "../lib/project-data";
import {ProjectDataService} from "../lib/services/project-data-service";
import {ProjectHelper} from "../lib/common/project-helper";
import {StaticConfig} from "../lib/config";
import {MessagesService} from "../lib/common/services/messages-service";
import {Yok} from '../lib/common/yok';
import * as stubs from './stubs';
import * as path from "path";
import * as temp from "temp";
temp.track();

function createTestInjector(): IInjector {
	let testInjector = new Yok();

	testInjector.register("messagesService", MessagesService);
	testInjector.register("errors", Errors);
	testInjector.register("fs", FileSystem);
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("options", Options);
	testInjector.register("pluginVariablesHelper", PluginVariablesHelper);
	testInjector.register("pluginVariablesService", PluginVariablesService);
	testInjector.register("projectData", ProjectData);
	testInjector.register("projectDataService", ProjectDataService);
	testInjector.register("projectHelper", ProjectHelper);
	testInjector.register("prompter", {
		get: () => {
			let errors: IErrors = testInjector.resolve("errors");
			errors.fail("$prompter.get function shouldn't be called!");
		}
	});
	testInjector.register("staticConfig", StaticConfig);

	return testInjector;
}

function createProjectFile(testInjector: IInjector): IFuture<string> {
	return (() => {
		let tempFolder = temp.mkdirSync("pluginVariablesService");

		let options = testInjector.resolve("options");
		options.path = tempFolder;

		let projectData = {
			"name": "myProject",
			"nativescript": { }
		};
		testInjector.resolve("fs").writeJson(path.join(tempFolder, "package.json"), projectData);

		return tempFolder;
	}).future<string>()();
}

function createPluginData(pluginVariables: any): IPluginData {
	let pluginData = {
		name: "myTestPlugin",
		version: "",
		fullPath: "",
		isPlugin: true,
		moduleInfo: "",
		platformsData: {
			ios: "",
			android: ""
		},
		pluginVariables: pluginVariables,
		pluginPlatformsFolderPath: (platform: string) => ""
	};

	return pluginData;
}

describe("Plugin Variables service", () => {
	let testInjector: IInjector;
	beforeEach(() => {
		testInjector = createTestInjector();
	});

	describe("plugin add when the console is non interactive", () => {
		beforeEach(() => {
			let helpers = require("./../lib/common/helpers");
			helpers.isInteractive = () => false;
		});
		it("fails when no --var option and no default value are specified", () => {
			createProjectFile(testInjector).wait();

			let pluginVariables = { "MY_TEST_PLUGIN_VARIABLE": { } };
			let pluginData = createPluginData(pluginVariables);
			let pluginVariablesService = testInjector.resolve("pluginVariablesService");

			let expectedError = `Unable to find value for MY_TEST_PLUGIN_VARIABLE plugin variable from ${pluginData.name} plugin. Ensure the --var option is specified or the plugin variable has default value.`;
			let actualError: string = null;

			try {
				pluginVariablesService.savePluginVariablesInProjectFile(pluginData).wait();
			} catch(err) {
				actualError = err.message;
			}

			assert.equal(expectedError, actualError);
		});
		it("does not fail when --var option is specified", () => {
			createProjectFile(testInjector).wait();

			let pluginVariableValue = "myAppId";
			testInjector.resolve("options").var = {
				"MY_APP_ID": pluginVariableValue
			};

			let pluginVariables = { "MY_APP_ID": { } };
			let pluginData = createPluginData(pluginVariables);
			let pluginVariablesService = testInjector.resolve("pluginVariablesService");
			pluginVariablesService.savePluginVariablesInProjectFile(pluginData).wait();

			let fs = testInjector.resolve("fs");
			let projectData = testInjector.resolve("projectData");
			let staticConfig: IStaticConfig = testInjector.resolve("staticConfig");

			let projectFileContent = fs.readJson(path.join(projectData.projectDir, "package.json"));
			assert.equal(pluginVariableValue, projectFileContent[staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][`${pluginData.name}-variables`]["MY_APP_ID"]);
		});
		it("does not fail when default value is specified", () => {
			createProjectFile(testInjector).wait();

			let defaultPluginValue = "myDefaultValue";
			let pluginVariables = { "MY_TEST_PLUGIN_VARIABLE": { defaultValue: defaultPluginValue } };
			let pluginData = createPluginData(pluginVariables);
			let pluginVariablesService = testInjector.resolve("pluginVariablesService");
			pluginVariablesService.savePluginVariablesInProjectFile(pluginData).wait();

			let fs = testInjector.resolve("fs");
			let projectData = testInjector.resolve("projectData");
			let staticConfig: IStaticConfig = testInjector.resolve("staticConfig");

			let projectFileContent = fs.readJson(path.join(projectData.projectDir, "package.json"));
			assert.equal(defaultPluginValue, projectFileContent[staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][`${pluginData.name}-variables`]["MY_TEST_PLUGIN_VARIABLE"]);
		});
	});

	describe("plugin add when the console is interactive", () => {
		beforeEach(() => {
			let helpers = require("./../lib/common/helpers");
			helpers.isInteractive = () => true;
		});
		it("prompt for plugin variable value when no --var option and no default value are specified", () => {
			createProjectFile(testInjector).wait();

			let pluginVariableValue = "testAppURL";
			let prompter = testInjector.resolve("prompter");
			prompter.get = () => {
				return Future.fromResult({ "APP_URL": pluginVariableValue });
			};

			let pluginVariables = { "APP_URL": { } };
			let pluginData = createPluginData(pluginVariables);
			let pluginVariablesService = testInjector.resolve("pluginVariablesService");
			pluginVariablesService.savePluginVariablesInProjectFile(pluginData).wait();

			let fs = testInjector.resolve("fs");
			let projectData = testInjector.resolve("projectData");
			let staticConfig: IStaticConfig = testInjector.resolve("staticConfig");

			let projectFileContent = fs.readJson(path.join(projectData.projectDir, "package.json"));
			assert.equal(pluginVariableValue, projectFileContent[staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][`${pluginData.name}-variables`]["APP_URL"]);
		});
		it("does not prompt for plugin variable value when default value is specified", () => {
			createProjectFile(testInjector).wait();

			let defaultPluginValue = "myAppNAme";
			let pluginVariables = { "APP_NAME": { defaultValue: defaultPluginValue } };
			let pluginData = createPluginData(pluginVariables);
			let pluginVariablesService = testInjector.resolve("pluginVariablesService");
			pluginVariablesService.savePluginVariablesInProjectFile(pluginData).wait();

			let fs = testInjector.resolve("fs");
			let projectData = testInjector.resolve("projectData");
			let staticConfig: IStaticConfig = testInjector.resolve("staticConfig");

			let projectFileContent = fs.readJson(path.join(projectData.projectDir, "package.json"));
			assert.equal(defaultPluginValue, projectFileContent[staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][`${pluginData.name}-variables`]["APP_NAME"]);
		});
		it("does not prompt for plugin variable value when --var option is specified", () => {
			createProjectFile(testInjector).wait();

			let pluginVariableValue = "pencho.goshko";
			testInjector.resolve("options").var = {
				"USERNAME": pluginVariableValue
			};

			let pluginVariables = { "USERNAME": { } };
			let pluginData = createPluginData(pluginVariables);
			let pluginVariablesService = testInjector.resolve("pluginVariablesService");
			pluginVariablesService.savePluginVariablesInProjectFile(pluginData).wait();

			let fs = testInjector.resolve("fs");
			let projectData = testInjector.resolve("projectData");
			let staticConfig: IStaticConfig = testInjector.resolve("staticConfig");

			let projectFileContent = fs.readJson(path.join(projectData.projectDir, "package.json"));
			assert.equal(pluginVariableValue, projectFileContent[staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][`${pluginData.name}-variables`]["USERNAME"]);
		});
	});

	describe("plugin interpolation", () => {
		it("fails when the plugin value is undefined", () => {
			let tempFolder = createProjectFile(testInjector).wait();

			let pluginVariables = { "MY_VAR": { } };
			let pluginData = createPluginData(pluginVariables);

			let fs: IFileSystem = testInjector.resolve("fs");
			let filePath = path.join(tempFolder, "myfile");
			fs.writeFile(filePath, "");

			let pluginVariablesService = testInjector.resolve("pluginVariablesService");

			let expectedError = "Unable to find the value for MY_VAR plugin variable into project package.json file. Verify that your package.json file is correct and try again.";
			let error: string = null;
			try {
				pluginVariablesService.interpolatePluginVariables(pluginData, filePath).wait();
			} catch(err) {
				error = err.message;
			}

			assert.equal(error, expectedError);
		});

		it("interpolates correctly plugin variable value", () => {
			let tempFolder = createProjectFile(testInjector).wait();

			let projectData: IProjectData = testInjector.resolve("projectData");
			let fs: IFileSystem = testInjector.resolve("fs");

			// Write plugin variables values to package.json file
			let packageJsonFilePath = path.join(projectData.projectDir, "package.json");
			let data = fs.readJson(packageJsonFilePath);
			data["nativescript"]["myTestPlugin-variables"] = {
				"FB_APP_NAME": "myFacebookAppName"
			};
			fs.writeJson(packageJsonFilePath, data);

			let pluginVariables = { "FB_APP_NAME": { } };
			let pluginData = createPluginData(pluginVariables);
			let pluginVariablesService = testInjector.resolve("pluginVariablesService");
			let pluginConfigurationFileContent = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
					'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
						'<activity android:label="@string/{FB_APP_NAME}" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
					'</application>' +
				'</manifest>';
			let filePath = path.join(tempFolder, "myfile");
			fs.writeFile(filePath, pluginConfigurationFileContent);

			pluginVariablesService.interpolatePluginVariables(pluginData, filePath).wait();

			let result = fs.readText(filePath);
			let expectedResult = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
					'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
						'<activity android:label="@string/myFacebookAppName" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
					'</application>' +
				'</manifest>';

			assert.equal(result, expectedResult);
		});

		it("interpolates correctly case sensive plugin variable value", () => {
			let tempFolder = createProjectFile(testInjector).wait();

			let projectData: IProjectData = testInjector.resolve("projectData");
			let fs: IFileSystem = testInjector.resolve("fs");

			// Write plugin variables values to package.json file
			let packageJsonFilePath = path.join(projectData.projectDir, "package.json");
			let data = fs.readJson(packageJsonFilePath);
			data["nativescript"]["myTestPlugin-variables"] = {
				"FB_APP_NAME": "myFacebookAppName"
			};
			fs.writeJson(packageJsonFilePath, data);

			let pluginVariables = { "FB_APP_NAME": { } };
			let pluginData = createPluginData(pluginVariables);
			let pluginVariablesService = testInjector.resolve("pluginVariablesService");
			let pluginConfigurationFileContent = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
					'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
						'<activity android:label="@string/{Fb_App_NaMe}" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
					'</application>' +
				'</manifest>';
			let filePath = path.join(tempFolder, "myfile");
			fs.writeFile(filePath, pluginConfigurationFileContent);

			pluginVariablesService.interpolatePluginVariables(pluginData, filePath).wait();

			let result = fs.readText(filePath);
			let expectedResult = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
					'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
						'<activity android:label="@string/myFacebookAppName" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
					'</application>' +
				'</manifest>';

			assert.equal(result, expectedResult);
		});

		it("interpolates correctly more than one plugin variables values", () => {
			let tempFolder = createProjectFile(testInjector).wait();

			let projectData: IProjectData = testInjector.resolve("projectData");
			let fs: IFileSystem = testInjector.resolve("fs");

			let packageJsonFilePath = path.join(projectData.projectDir, "package.json");
			let data = fs.readJson(packageJsonFilePath);
			data["nativescript"]["myTestPlugin-variables"] = {
				"FB_APP_NAME": "myFacebookAppName",
				"FB_APP_URL": "myFacebookAppURl"
			};
			fs.writeJson(packageJsonFilePath, data);

			let pluginVariables = { "FB_APP_NAME": { }, "FB_APP_URL": { } };
			let pluginData = createPluginData(pluginVariables);
			let pluginVariablesService = testInjector.resolve("pluginVariablesService");
			let pluginConfigurationFileContent = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
					'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
						'<activity android:label="@string/{Fb_App_NaMe}" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
						'<activity android:label="@string/{FB_APP_url}" />' +
					'</application>' +
				'</manifest>';
			let filePath = path.join(tempFolder, "myfile");
			fs.writeFile(filePath, pluginConfigurationFileContent);

			pluginVariablesService.interpolatePluginVariables(pluginData, filePath).wait();

			let result = fs.readText(filePath);
			let expectedResult = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
					'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
						'<activity android:label="@string/myFacebookAppName" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
						'<activity android:label="@string/myFacebookAppURl" />' +
					'</application>' +
				'</manifest>';

			assert.equal(result, expectedResult);
		});
	});
});
