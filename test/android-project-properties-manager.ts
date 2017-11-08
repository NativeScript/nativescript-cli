import * as ProjectPropertiesParserLib from "../lib/common/properties-parser";
import * as FsLib from "../lib/common/file-system";
import * as ProjectPropertiesManagerLib from "../lib/services/android-project-properties-manager";
import * as HostInfoLib from "../lib/common/host-info";
import * as StaticConfigLib from "../lib/config";
import * as ErrorsLib from "../lib/common/errors";
import * as LoggerLib from "../lib/common/logger";
import * as ConfigLib from "../lib/config";
import * as OptionsLib from "../lib/options";
import * as yok from "../lib/common/yok";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
import * as path from "path";
import temp = require("temp");
temp.track();
import { assert } from "chai";

function createTestInjector(): IInjector {
	const testInjector = new yok.Yok();
	testInjector.register("propertiesParser", ProjectPropertiesParserLib.PropertiesParser);
	testInjector.register("fs", FsLib.FileSystem);
	testInjector.register("hostInfo", HostInfoLib.HostInfo);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("logger", LoggerLib.Logger);
	testInjector.register("config", ConfigLib.Configuration);
	testInjector.register("options", OptionsLib.Options);
	testInjector.register("settingsService", SettingsService);

	return testInjector;
}

describe("Android project properties parser tests", () => {
	it("adds project reference", async () => {
		const testInjector = createTestInjector();
		const fs = testInjector.resolve("fs");

		const projectPropertiesFileContent = 'target=android-21';
		const tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");
		fs.writeFile(path.join(tempFolder, "project.properties"), projectPropertiesFileContent);

		const projectPropertiesManager: IAndroidProjectPropertiesManager = testInjector.resolve(
			ProjectPropertiesManagerLib.AndroidProjectPropertiesManager, { directoryPath: tempFolder });
		await projectPropertiesManager.addProjectReference("testValue");

		const expectedContent = 'target=android-21' + '\n' +
			'android.library.reference.1=testValue';
		const actualContent = fs.readText(path.join(tempFolder, "project.properties"));

		assert.equal(expectedContent, actualContent);
		assert.equal(1, _.keys(await projectPropertiesManager.getProjectReferences()).length);
	});

	it("adds project reference if another referencence already exists in project.properties file", async () => {
		const testInjector = createTestInjector();
		const fs = testInjector.resolve("fs");

		const projectPropertiesFileContent = 'target=android-21' + '\n' +
			'android.library.reference.1=someValue';
		const tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");
		fs.writeFile(path.join(tempFolder, "project.properties"), projectPropertiesFileContent);

		const projectPropertiesManager = testInjector.resolve(
			ProjectPropertiesManagerLib.AndroidProjectPropertiesManager, { directoryPath: tempFolder });
		await projectPropertiesManager.addProjectReference("testValue");

		const expectedContent = ['target=android-21',
			'android.library.reference.1=someValue',
			'android.library.reference.2=testValue'].join('\n');
		const actualContent = fs.readText(path.join(tempFolder, "project.properties"));

		assert.equal(expectedContent, actualContent);
		assert.equal(2, _.keys(await projectPropertiesManager.getProjectReferences()).length);
	});
	it("adds project reference if more than one references exist in project.properties file", async () => {
		const testInjector = createTestInjector();
		const fs = testInjector.resolve("fs");

		const projectPropertiesFileContent = ['target=android-21',
			'android.library.reference.1=value1',
			'android.library.reference.2=value2',
			'android.library.reference.3=value3',
			'android.library.reference.4=value4',
			'android.library.reference.5=value5'].join('\n');
		const tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");
		fs.writeFile(path.join(tempFolder, "project.properties"), projectPropertiesFileContent);

		const projectPropertiesManager: IAndroidProjectPropertiesManager = testInjector.resolve(
			ProjectPropertiesManagerLib.AndroidProjectPropertiesManager, { directoryPath: tempFolder });
		await projectPropertiesManager.addProjectReference("testValue");

		const expectedContent = projectPropertiesFileContent + '\n' +
			'android.library.reference.6=testValue';

		const actualContent = fs.readText(path.join(tempFolder, "project.properties"));

		assert.equal(expectedContent, actualContent);
		assert.equal(6, _.keys(await projectPropertiesManager.getProjectReferences()).length);
	});
	it("removes project reference if only one reference exists", async () => {
		const testInjector = createTestInjector();
		const fs = testInjector.resolve("fs");

		const projectPropertiesFileContent = 'android.library.reference.1=value1' + '\n' +
			'target=android-21';
		const tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");
		fs.writeFile(path.join(tempFolder, "project.properties"), projectPropertiesFileContent);

		const projectPropertiesManager: IAndroidProjectPropertiesManager = testInjector.resolve(
			ProjectPropertiesManagerLib.AndroidProjectPropertiesManager, { directoryPath: tempFolder });
		await projectPropertiesManager.removeProjectReference("value1");

		const expectedContent = 'target=android-21';
		const actualContent = fs.readText(path.join(tempFolder, "project.properties"));

		assert.equal(expectedContent, actualContent);
		assert.equal(0, _.keys(await projectPropertiesManager.getProjectReferences()).length);
	});
	it("removes project reference when another references exist before and after the specified reference", async () => {
		const testInjector = createTestInjector();
		const fs = testInjector.resolve("fs");

		const projectPropertiesFileContent = ['target=android-17',
			'android.library.reference.1=value1',
			'android.library.reference.2=value2',
			'android.library.reference.3=value3',
			'android.library.reference.4=value4',
			'android.library.reference.5=value5'].join('\n');
		const tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");
		fs.writeFile(path.join(tempFolder, "project.properties"), projectPropertiesFileContent);

		const projectPropertiesManager: IAndroidProjectPropertiesManager = testInjector.resolve(
			ProjectPropertiesManagerLib.AndroidProjectPropertiesManager, { directoryPath: tempFolder });
		await projectPropertiesManager.removeProjectReference("value3");

		const expectedContent = ['target=android-17',
			'android.library.reference.1=value1',
			'android.library.reference.2=value2',
			'android.library.reference.3=value4',
			'android.library.reference.4=value5'].join('\n') + '\n';
		const actualContent = fs.readText(path.join(tempFolder, "project.properties"));

		assert.equal(expectedContent, actualContent);
		assert.equal(4, _.keys(await projectPropertiesManager.getProjectReferences()).length);
	});
});
