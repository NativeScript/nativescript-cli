/// <reference path=".d.ts" />
"use strict";

import yok = require('../lib/common/yok');
import fsLib = require("../lib/common/file-system");
import projectFilesManagerLib = require("../lib/services/project-files-manager");
import hostInfoLib = require("../lib/common/host-info");
import StaticConfigLib = require("../lib/config");
import ErrorsLib = require("../lib/common/errors");
import * as path from "path";
import temp = require("temp");
temp.track();

let assert = require("chai").assert;

function createTestInjector() {
	let testInjector = new yok.Yok();
	testInjector.register("fs", fsLib.FileSystem);
	testInjector.register("hostInfo", hostInfoLib.HostInfo);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("projectFilesManager", projectFilesManagerLib.ProjectFilesManager);
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("platformsData", {
		platformsNames: ["ios", "android"]
	});

	return testInjector;
}

function createFiles(testInjector: IInjector, filesToCreate: string[]): IFuture<string> {
	return (() => {
		let fs = testInjector.resolve("fs");
		let directoryPath = temp.mkdirSync("Project Files Manager Tests");

		_.each(filesToCreate, file => fs.writeFile(path.join(directoryPath, file), "").wait());

		return directoryPath;
	}).future<string>()();
}

describe('Project Files Manager Tests', () => {
	let testInjector: IInjector, projectFilesManager: IProjectFilesManager;
	beforeEach(() => {
		testInjector = createTestInjector();
		projectFilesManager = testInjector.resolve("projectFilesManager");
	});
	it("filters android specific files", () => {
		let files = ["test.ios.x", "test.android.x"];
		let directoryPath = createFiles(testInjector, files).wait();

		projectFilesManager.processPlatformSpecificFiles(directoryPath, "android").wait();

		let fs = testInjector.resolve("fs");
		assert.isFalse(fs.exists(path.join(directoryPath, "test.ios.x")).wait());
		assert.isTrue(fs.exists(path.join(directoryPath, "test.x")).wait());
		assert.isFalse(fs.exists(path.join(directoryPath, "test.android.x")).wait());
	});
	it("filters ios specific files", () => {
		let files = ["index.ios.html", "index1.android.html", "a.test"];
		let directoryPath = createFiles(testInjector, files).wait();

		projectFilesManager.processPlatformSpecificFiles(directoryPath, "ios").wait();

		let fs = testInjector.resolve("fs");
		assert.isFalse(fs.exists(path.join(directoryPath, "index1.android.html")).wait());
		assert.isFalse(fs.exists(path.join(directoryPath, "index1.html")).wait());
		assert.isTrue(fs.exists(path.join(directoryPath, "index.html")).wait());
		assert.isTrue(fs.exists(path.join(directoryPath, "a.test")).wait());
	});
	it("doesn't filter non platform specific files", () => {
		let files = ["index1.js", "index2.js", "index3.js"];
		let directoryPath = createFiles(testInjector, files).wait();

		projectFilesManager.processPlatformSpecificFiles(directoryPath, "ios").wait();

		let fs = testInjector.resolve("fs");
		assert.isTrue(fs.exists(path.join(directoryPath, "index1.js")).wait());
		assert.isTrue(fs.exists(path.join(directoryPath, "index2.js")).wait());
		assert.isTrue(fs.exists(path.join(directoryPath, "index3.js")).wait());
	});
});
