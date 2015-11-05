/// <reference path=".d.ts" />
"use strict";

import {assert} from "chai";
import * as ConfigLib from "../lib/config";
import * as ErrorsLib from "../lib/common/errors";
import * as FsLib from "../lib/common/file-system";
import * as HostInfoLib from "../lib/common/host-info";
import * as LoggerLib from "../lib/common/logger";
import * as NpmInstallationManagerLib from "../lib/npm-installation-manager";
import * as OptionsLib from "../lib/options";
import * as StaticConfigLib from "../lib/config";
import Future = require("fibers/future");
import * as yok from "../lib/common/yok";

function createTestInjector(): IInjector {
	let testInjector = new yok.Yok();

	testInjector.register("config", ConfigLib.Configuration);
	testInjector.register("logger", LoggerLib.Logger);
	testInjector.register("lockfile", { });
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("options", OptionsLib.Options);
	testInjector.register("fs", FsLib.FileSystem);
	testInjector.register("hostInfo", HostInfoLib.HostInfo);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);

	testInjector.register("npmInstallationManager", NpmInstallationManagerLib.NpmInstallationManager);

	return testInjector;
}

function mockNpm(testInjector: IInjector, versions: string[], latestVersion: string) {
	testInjector.register("npm", {
		view: (packageName: string, propertyName: string) => {
			return (() => {
				if(propertyName === "versions") {
					let result = Object.create(null);
					result[latestVersion] = {
						"versions": versions
					};

					return result;
				}

				throw new Error(`Unable to find propertyName ${propertyName}.`);
			}).future<any>()();
		},
		load: () => Future.fromResult()
	});
}

describe("Npm installation manager tests", () => {
	it("returns correct latest compatible version when only one exists", () => {
		let testInjector = createTestInjector();

		let versions = ["1.4.0"];
		let latestVersion = "1.4.0";

		mockNpm(testInjector, versions, latestVersion);

		// Mock staticConfig.version
		let staticConfig = testInjector.resolve("staticConfig");
		staticConfig.version = "1.4.0";

		// Mock npmInstallationManager.getLatestVersion
		let npmInstallationManager = testInjector.resolve("npmInstallationManager");
		npmInstallationManager.getLatestVersion = (packageName: string) => Future.fromResult(latestVersion);

		let actualLatestCompatibleVersion = npmInstallationManager.getLatestCompatibleVersion("").wait();
		let expectedLatestCompatibleVersion = "1.4.0";
		assert.equal(actualLatestCompatibleVersion, expectedLatestCompatibleVersion);
	});

	it("returns correct latest compatible version", () => {
		let testInjector = createTestInjector();

		let versions = ["1.2.0", "1.3.0", "1.3.1", "1.3.2", "1.3.3", "1.4.0"];
		let latestVersion = "1.3.3";

		mockNpm(testInjector, versions, latestVersion);

		// Mock staticConfig.version
		let staticConfig = testInjector.resolve("staticConfig");
		staticConfig.version = "1.3.0";

		// Mock npmInstallationManager.getLatestVersion
		let npmInstallationManager = testInjector.resolve("npmInstallationManager");
		npmInstallationManager.getLatestVersion = (packageName: string) => Future.fromResult(latestVersion);

		let actualLatestCompatibleVersion = npmInstallationManager.getLatestCompatibleVersion("").wait();
		let expectedLatestCompatibleVersion = "1.3.3";
		assert.equal(actualLatestCompatibleVersion, expectedLatestCompatibleVersion);
	});

	it("returns correct latest compatible version", () => {
		let testInjector = createTestInjector();

		let versions = ["1.2.0", "1.3.0", "1.3.1", "1.3.2", "1.3.3", "1.4.0"];
		let latestVersion = _.last(versions);
		mockNpm(testInjector, versions, latestVersion);

		// Mock staticConfig.version
		let staticConfig = testInjector.resolve("staticConfig");
		staticConfig.version = "1.5.0";

		// Mock npmInstallationManager.getLatestVersion
		let npmInstallationManager = testInjector.resolve("npmInstallationManager");
		npmInstallationManager.getLatestVersion = (packageName: string) => Future.fromResult(latestVersion);

		let actualLatestCompatibleVersion = npmInstallationManager.getLatestCompatibleVersion("").wait();
		assert.equal(actualLatestCompatibleVersion, latestVersion);
	});
});
