import { assert } from "chai";
import { Errors } from "../lib/common/errors";
import { FileSystem } from "../lib/common/file-system";
import { HostInfo } from "../lib/common/host-info";
import { Options } from "../lib/options";
import { PluginVariablesHelper } from "../lib/common/plugin-variables-helper";
import { PluginVariablesService } from "../lib/services/plugin-variables-service";
import { ProjectData } from "../lib/project-data";
import { ProjectDataService } from "../lib/services/project-data-service";
import { ProjectHelper } from "../lib/common/project-helper";
import { StaticConfig } from "../lib/config";
import { MessagesService } from "../lib/common/services/messages-service";
import { Yok } from '../lib/common/yok';
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import * as stubs from './stubs';
import * as path from "path";
import * as temp from "temp";
temp.track();

function createTestInjector(): IInjector {
	const testInjector = new Yok();

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
			const errors: IErrors = testInjector.resolve("errors");
			errors.fail("$prompter.get function shouldn't be called!");
		}
	});
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("settingsService", SettingsService);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("androidResourcesMigrationService", {
		hasMigrated: () => true
	});

	return testInjector;
}

async function createProjectFile(testInjector: IInjector): Promise<string> {
	const tempFolder = temp.mkdirSync("pluginVariablesService");

	const options = testInjector.resolve("options");
	options.path = tempFolder;

	const projectData = {
		"name": "myProject",
		"nativescript": {
			id: { android: "", ios: ""}
		}
	};
	testInjector.resolve("fs").writeJson(path.join(tempFolder, "package.json"), projectData);

	return tempFolder;
}

function createPluginData(pluginVariables: any): IPluginData {
	const pluginData = {
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
			const helpers = require("./../lib/common/helpers");
			helpers.isInteractive = () => false;
		});
		it("fails when no --var option and no default value are specified", async () => {
			await createProjectFile(testInjector);

			const pluginVariables = { "MY_TEST_PLUGIN_VARIABLE": {} };
			const pluginData = createPluginData(pluginVariables);
			const pluginVariablesService: IPluginVariablesService = testInjector.resolve("pluginVariablesService");
			const projectData: IProjectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();

			const expectedError = `Unable to find value for MY_TEST_PLUGIN_VARIABLE plugin variable from ${pluginData.name} plugin. Ensure the --var option is specified or the plugin variable has default value.`;
			let actualError: string = null;

			try {
				await pluginVariablesService.savePluginVariablesInProjectFile(pluginData, projectData.projectDir);
			} catch (err) {
				actualError = err.message;
			}

			assert.equal(expectedError, actualError);
		});
		it("does not fail when --var option is specified", async () => {
			await createProjectFile(testInjector);

			const pluginVariableValue = "myAppId";
			testInjector.resolve("options").var = {
				"MY_APP_ID": pluginVariableValue
			};

			const pluginVariables = { "MY_APP_ID": {} };
			const pluginData = createPluginData(pluginVariables);
			const pluginVariablesService: IPluginVariablesService = testInjector.resolve("pluginVariablesService");
			const projectData: IProjectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();
			await pluginVariablesService.savePluginVariablesInProjectFile(pluginData, projectData.projectDir);

			const fs = testInjector.resolve("fs");
			const staticConfig: IStaticConfig = testInjector.resolve("staticConfig");

			const projectFileContent = fs.readJson(path.join(projectData.projectDir, "package.json"));
			assert.equal(pluginVariableValue, projectFileContent[staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][`${pluginData.name}-variables`]["MY_APP_ID"]);
		});
		it("does not fail when default value is specified", async () => {
			await createProjectFile(testInjector);

			const defaultPluginValue = "myDefaultValue";
			const pluginVariables = { "MY_TEST_PLUGIN_VARIABLE": { defaultValue: defaultPluginValue } };
			const pluginData = createPluginData(pluginVariables);
			const pluginVariablesService: IPluginVariablesService = testInjector.resolve("pluginVariablesService");
			const projectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();

			await pluginVariablesService.savePluginVariablesInProjectFile(pluginData, projectData.projectDir);

			const fs = testInjector.resolve("fs");
			const staticConfig: IStaticConfig = testInjector.resolve("staticConfig");

			const projectFileContent = fs.readJson(path.join(projectData.projectDir, "package.json"));
			assert.equal(defaultPluginValue, projectFileContent[staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][`${pluginData.name}-variables`]["MY_TEST_PLUGIN_VARIABLE"]);
		});
	});

	describe("plugin add when the console is interactive", () => {
		beforeEach(() => {
			const helpers = require("./../lib/common/helpers");
			helpers.isInteractive = () => true;
		});
		it("prompt for plugin variable value when no --var option and no default value are specified", async () => {
			await createProjectFile(testInjector);

			const pluginVariableValue = "testAppURL";
			const prompter = testInjector.resolve("prompter");
			prompter.get = async () => ({ "APP_URL": pluginVariableValue });

			const pluginVariables = { "APP_URL": {} };
			const pluginData = createPluginData(pluginVariables);
			const pluginVariablesService: IPluginVariablesService = testInjector.resolve("pluginVariablesService");
			const projectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();
			await pluginVariablesService.savePluginVariablesInProjectFile(pluginData, projectData.projectDir);

			const fs = testInjector.resolve("fs");
			const staticConfig: IStaticConfig = testInjector.resolve("staticConfig");

			const projectFileContent = fs.readJson(path.join(projectData.projectDir, "package.json"));
			assert.equal(pluginVariableValue, projectFileContent[staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][`${pluginData.name}-variables`]["APP_URL"]);
		});
		it("does not prompt for plugin variable value when default value is specified", async () => {
			await createProjectFile(testInjector);

			const defaultPluginValue = "myAppNAme";
			const pluginVariables = { "APP_NAME": { defaultValue: defaultPluginValue } };
			const pluginData = createPluginData(pluginVariables);
			const pluginVariablesService: IPluginVariablesService = testInjector.resolve("pluginVariablesService");
			const projectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();

			await pluginVariablesService.savePluginVariablesInProjectFile(pluginData, projectData.projectDir);

			const fs = testInjector.resolve("fs");
			const staticConfig: IStaticConfig = testInjector.resolve("staticConfig");

			const projectFileContent = fs.readJson(path.join(projectData.projectDir, "package.json"));
			assert.equal(defaultPluginValue, projectFileContent[staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][`${pluginData.name}-variables`]["APP_NAME"]);
		});
		it("does not prompt for plugin variable value when --var option is specified", async () => {
			await createProjectFile(testInjector);

			const pluginVariableValue = "pencho.goshko";
			testInjector.resolve("options").var = {
				"USERNAME": pluginVariableValue
			};

			const pluginVariables = { "USERNAME": {} };
			const pluginData = createPluginData(pluginVariables);
			const pluginVariablesService: IPluginVariablesService = testInjector.resolve("pluginVariablesService");
			const projectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();
			await pluginVariablesService.savePluginVariablesInProjectFile(pluginData, projectData.projectDir);

			const fs = testInjector.resolve("fs");
			const staticConfig: IStaticConfig = testInjector.resolve("staticConfig");

			const projectFileContent = fs.readJson(path.join(projectData.projectDir, "package.json"));
			assert.equal(pluginVariableValue, projectFileContent[staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][`${pluginData.name}-variables`]["USERNAME"]);
		});
	});

	describe("plugin interpolation", () => {
		it("fails when the plugin value is undefined", async () => {
			const tempFolder = await createProjectFile(testInjector);

			const pluginVariables = { "MY_VAR": {} };
			const pluginData = createPluginData(pluginVariables);

			const fs: IFileSystem = testInjector.resolve("fs");
			const filePath = path.join(tempFolder, "myfile");
			fs.writeFile(filePath, "");

			const pluginVariablesService: IPluginVariablesService = testInjector.resolve("pluginVariablesService");
			const projectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();

			const expectedError = "Unable to find the value for MY_VAR plugin variable into project package.json file. Verify that your package.json file is correct and try again.";
			let error: string = null;
			try {
				await pluginVariablesService.interpolatePluginVariables(pluginData, filePath, projectData.projectDir);
			} catch (err) {
				error = err.message;
			}

			assert.equal(error, expectedError);
		});

		it("interpolates correctly plugin variable value", async () => {
			const tempFolder = await createProjectFile(testInjector);

			const projectData: IProjectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();
			const fs: IFileSystem = testInjector.resolve("fs");

			// Write plugin variables values to package.json file
			const packageJsonFilePath = path.join(projectData.projectDir, "package.json");
			const data = fs.readJson(packageJsonFilePath);
			data["nativescript"]["myTestPlugin-variables"] = {
				"FB_APP_NAME": "myFacebookAppName"
			};
			fs.writeJson(packageJsonFilePath, data);

			const pluginVariables = { "FB_APP_NAME": {} };
			const pluginData = createPluginData(pluginVariables);
			const pluginVariablesService: IPluginVariablesService = testInjector.resolve("pluginVariablesService");
			const pluginConfigurationFileContent = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
				'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
				'<activity android:label="@string/{FB_APP_NAME}" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
				'</application>' +
				'</manifest>';
			const filePath = path.join(tempFolder, "myfile");
			fs.writeFile(filePath, pluginConfigurationFileContent);

			await pluginVariablesService.interpolatePluginVariables(pluginData, filePath, projectData.projectDir);

			const result = fs.readText(filePath);
			const expectedResult = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
				'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
				'<activity android:label="@string/myFacebookAppName" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
				'</application>' +
				'</manifest>';

			assert.equal(result, expectedResult);
		});

		it("interpolates correctly case sensive plugin variable value", async () => {
			const tempFolder = await createProjectFile(testInjector);

			const projectData: IProjectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();
			const fs: IFileSystem = testInjector.resolve("fs");

			// Write plugin variables values to package.json file
			const packageJsonFilePath = path.join(projectData.projectDir, "package.json");
			const data = fs.readJson(packageJsonFilePath);
			data["nativescript"]["myTestPlugin-variables"] = {
				"FB_APP_NAME": "myFacebookAppName"
			};
			fs.writeJson(packageJsonFilePath, data);

			const pluginVariables = { "FB_APP_NAME": {} };
			const pluginData = createPluginData(pluginVariables);
			const pluginVariablesService: IPluginVariablesService = testInjector.resolve("pluginVariablesService");
			const pluginConfigurationFileContent = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
				'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
				'<activity android:label="@string/{Fb_App_NaMe}" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
				'</application>' +
				'</manifest>';
			const filePath = path.join(tempFolder, "myfile");
			fs.writeFile(filePath, pluginConfigurationFileContent);

			await pluginVariablesService.interpolatePluginVariables(pluginData, filePath, projectData.projectDir);

			const result = fs.readText(filePath);
			const expectedResult = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
				'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
				'<activity android:label="@string/myFacebookAppName" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
				'</application>' +
				'</manifest>';

			assert.equal(result, expectedResult);
		});

		it("interpolates correctly more than one plugin variables values", async () => {
			const tempFolder = await createProjectFile(testInjector);

			const projectData: IProjectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();
			const fs: IFileSystem = testInjector.resolve("fs");

			const packageJsonFilePath = path.join(projectData.projectDir, "package.json");
			const data = fs.readJson(packageJsonFilePath);
			data["nativescript"]["myTestPlugin-variables"] = {
				"FB_APP_NAME": "myFacebookAppName",
				"FB_APP_URL": "myFacebookAppURl"
			};
			fs.writeJson(packageJsonFilePath, data);

			const pluginVariables = { "FB_APP_NAME": {}, "FB_APP_URL": {} };
			const pluginData = createPluginData(pluginVariables);
			const pluginVariablesService: IPluginVariablesService = testInjector.resolve("pluginVariablesService");
			const pluginConfigurationFileContent = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
				'<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
				'<activity android:label="@string/{Fb_App_NaMe}" android:name="com.facebook.LoginActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>' +
				'<activity android:label="@string/{FB_APP_url}" />' +
				'</application>' +
				'</manifest>';
			const filePath = path.join(tempFolder, "myfile");
			fs.writeFile(filePath, pluginConfigurationFileContent);

			await pluginVariablesService.interpolatePluginVariables(pluginData, filePath, projectData.projectDir);

			const result = fs.readText(filePath);
			const expectedResult = '<?xml version="1.0" encoding="UTF-8"?>' +
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
