/// <reference path=".d.ts" />
"use strict";

import ProjectPropertiesParserLib = require("../lib/common/properties-parser");
import FsLib = require("../lib/common/file-system");
import ProjectPropertiesManagerLib = require("../lib/services/android-project-properties-manager");
import HostInfoLib = require("../lib/common/host-info");
import StaticConfigLib = require("../lib/config");
import ErrorsLib = require("../lib/common/errors");
import LoggerLib = require("../lib/common/logger");
import ConfigLib = require("../lib/config");
import OptionsLib = require("../lib/options");
import yok = require("../lib/common/yok");

import os = require("os");
import path = require("path");

import temp = require("temp");
temp.track();

let assert = require("chai").assert;

function createTestInjector(): IInjector {
	let testInjector = new yok.Yok();
	testInjector.register("propertiesParser", ProjectPropertiesParserLib.PropertiesParser);
	testInjector.register("fs", FsLib.FileSystem);
	testInjector.register("hostInfo", HostInfoLib.HostInfo);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("logger", LoggerLib.Logger);
	testInjector.register("config", ConfigLib.Configuration);
	testInjector.register("options", OptionsLib.Options);
	
	return testInjector;
}

describe("Android project properties parser tests", () => {
	it("adds project reference", () => {
		let testInjector = createTestInjector();
		let fs = testInjector.resolve("fs"); 
		
		let projectPropertiesFileContent = 'target=android-21';
		let tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");	
		fs.writeFile(path.join(tempFolder, "project.properties"), projectPropertiesFileContent).wait();
		
		let projectPropertiesManager = testInjector.resolve(ProjectPropertiesManagerLib.AndroidProjectPropertiesManager, {directoryPath: tempFolder});
		projectPropertiesManager.addProjectReference("testValue").wait();
		
		let expectedContent = 'target=android-21' + os.EOL +
		'android.library.reference.1=testValue';
		let actualContent = fs.readText(path.join(tempFolder, "project.properties")).wait();
		
		assert.equal(expectedContent, actualContent);
		assert.equal(1, _.keys(projectPropertiesManager.getProjectReferences().wait()).length);
	});
	it("adds project reference if another referencence already exists in project.properties file", () => {
		let testInjector = createTestInjector();
		let fs = testInjector.resolve("fs"); 
		
		let projectPropertiesFileContent = 'target=android-21' + os.EOL +
		'android.library.reference.1=someValue';
		let tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");	
		fs.writeFile(path.join(tempFolder, "project.properties"), projectPropertiesFileContent).wait();
		
		let projectPropertiesManager = testInjector.resolve(ProjectPropertiesManagerLib.AndroidProjectPropertiesManager, {directoryPath: tempFolder});
		projectPropertiesManager.addProjectReference("testValue").wait();
		
		let expectedContent = 'target=android-21' + os.EOL +
		'android.library.reference.1=someValue' + os.EOL + 
		'android.library.reference.2=testValue';
		let actualContent = fs.readText(path.join(tempFolder, "project.properties")).wait();
		
		assert.equal(expectedContent, actualContent);
		assert.equal(2, _.keys(projectPropertiesManager.getProjectReferences().wait()).length);
	});
	it("adds project reference if more than one references exist in project.properties file", () => {
		let testInjector = createTestInjector();
		let fs = testInjector.resolve("fs"); 
		
		let projectPropertiesFileContent = 'target=android-21' + os.EOL +
		'android.library.reference.1=value1' + os.EOL +
		'android.library.reference.2=value2' + os.EOL + 
		'android.library.reference.3=value3' + os.EOL +
		'android.library.reference.4=value4' + os.EOL +
		'android.library.reference.5=value5';
		let tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");	
		fs.writeFile(path.join(tempFolder, "project.properties"), projectPropertiesFileContent).wait();
		
		let projectPropertiesManager: IAndroidProjectPropertiesManager = testInjector.resolve(ProjectPropertiesManagerLib.AndroidProjectPropertiesManager, {directoryPath: tempFolder});
		projectPropertiesManager.addProjectReference("testValue").wait();
		
		let expectedContent = projectPropertiesFileContent + os.EOL + 
		'android.library.reference.6=testValue';
		
		let actualContent = fs.readText(path.join(tempFolder, "project.properties")).wait();
		
		assert.equal(expectedContent, actualContent);
		assert.equal(6, _.keys(projectPropertiesManager.getProjectReferences().wait()).length);
	});
	it("removes project reference if only one reference exists", () => {
		let testInjector = createTestInjector();
		let fs = testInjector.resolve("fs"); 
		
		let projectPropertiesFileContent = 'android.library.reference.1=value1' + os.EOL + 
		'target=android-21';
		let tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");	
		fs.writeFile(path.join(tempFolder, "project.properties"), projectPropertiesFileContent).wait();
		
		let projectPropertiesManager: IAndroidProjectPropertiesManager = testInjector.resolve(ProjectPropertiesManagerLib.AndroidProjectPropertiesManager, {directoryPath: tempFolder});
		projectPropertiesManager.removeProjectReference("value1").wait();
		
		let expectedContent = 'target=android-21';
		let actualContent = fs.readText(path.join(tempFolder, "project.properties")).wait();
		
		assert.equal(expectedContent, actualContent);
		assert.equal(0, _.keys(projectPropertiesManager.getProjectReferences().wait()).length);
	});
	it("removes project reference when another references exist before and after the specified reference", () => {
		let testInjector = createTestInjector();
		let fs = testInjector.resolve("fs"); 
		
		let projectPropertiesFileContent = 'target=android-17' + os.EOL + 
		'android.library.reference.1=value1' + os.EOL +
		'android.library.reference.2=value2' + os.EOL + 
		'android.library.reference.3=value3' + os.EOL +
		'android.library.reference.4=value4' + os.EOL +
		'android.library.reference.5=value5';
		let tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");	
		fs.writeFile(path.join(tempFolder, "project.properties"), projectPropertiesFileContent).wait();
		
		let projectPropertiesManager: IAndroidProjectPropertiesManager = testInjector.resolve(ProjectPropertiesManagerLib.AndroidProjectPropertiesManager, {directoryPath: tempFolder});
		projectPropertiesManager.removeProjectReference("value3").wait();
		
		let expectedContent = 'target=android-17' + os.EOL + 
		'android.library.reference.1=value1' + os.EOL + 
		'android.library.reference.2=value2' + os.EOL + 
		'android.library.reference.3=value4' + os.EOL + 
		'android.library.reference.4=value5' + os.EOL;
		let actualContent = fs.readText(path.join(tempFolder, "project.properties")).wait();
		
		assert.equal(expectedContent, actualContent);
		assert.equal(4, _.keys(projectPropertiesManager.getProjectReferences().wait()).length);
	});
});