import { assert } from "chai";
import * as _ from "lodash";
import { XcconfigService } from "../lib/services/xcconfig-service";
import * as yok from "../lib/common/yok";
import { IXcconfigService } from "../lib/declarations";
import { IInjector } from "../lib/common/definitions/yok";
import { IReadFileOptions } from "../lib/common/declarations";

// start tracking temporary folders/files

describe("XCConfig Service Tests", () => {
	const createTestInjector = (): IInjector => {
		const testInjector = new yok.Yok();
		testInjector.register("fs", {
			exists: (path: string) => {
				return true;
			},
		});
		testInjector.register("childProcess", {});
		testInjector.register("xcprojService", {});

		testInjector.register("xcconfigService", XcconfigService);

		return testInjector;
	};

	const assertPropertyValues = (expected: any, injector: IInjector) => {
		const service = getXCConfigService(injector);
		_.forOwn(expected, (value, key) => {
			const actual = service.readPropertyValue("any", key);
			assert.equal(actual, value);
		});
	};

	function getXCConfigService(injector: IInjector): IXcconfigService {
		return injector.resolve("xcconfigService");
	}

	function getFileSystemMock(injector: IInjector): any {
		return injector.resolve("$fs");
	}

	describe("Read Property Value", () => {
		it("Return empty value, for unexistent file", () => {
			const injector = createTestInjector();
			injector.register("fs", {
				exists: (path: string) => {
					return false;
				},
			});

			const service = getXCConfigService(injector);
			const actual = service.readPropertyValue("any", "any");

			assert.isNull(actual);
		});

		it("Returns correct value for well-formatted document", () => {
			const injector = createTestInjector();
			const fs = getFileSystemMock(injector);
			fs.readText = (
				filename: string,
				options?: IReadFileOptions | string,
			): string => {
				return `// You can add custom settings here
						// for example you can uncomment the following line to force distribution code signing
						CODE_SIGN_IDENTITY = iPhone Distribution
						// To build for device with XCode you need to specify your development team. More info: https://developer.apple.com/library/prerelease/content/releasenotes/DeveloperTools/RN-Xcode/Introduction.html
						// DEVELOPMENT_TEAM = YOUR_TEAM_ID;
						ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
						ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME = LaunchImage;`;
			};

			const expected = {
				ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
				ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME: "LaunchImage",
				CODE_SIGN_IDENTITY: "iPhone Distribution",
			};

			assertPropertyValues(expected, injector);
		});

		it("Returns correct value for values with missing ; at the end of the line.", () => {
			const injector = createTestInjector();
			const fs = getFileSystemMock(injector);
			fs.readText = (
				filename: string,
				options?: IReadFileOptions | string,
			): string => {
				return `// You can add custom settings here
						// for example you can uncomment the following line to force distribution code signing
						CODE_SIGN_IDENTITY = iPhone Distribution
						// To build for device with XCode you need to specify your development team. More info: https://developer.apple.com/library/prerelease/content/releasenotes/DeveloperTools/RN-Xcode/Introduction.html
						// DEVELOPMENT_TEAM = YOUR_TEAM_ID
						ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon
						ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME = LaunchImage`;
			};

			const expected = {
				ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
				ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME: "LaunchImage",
				CODE_SIGN_IDENTITY: "iPhone Distribution",
			};

			assertPropertyValues(expected, injector);
		});

		it("Doesn't read value from a commented-out line.", () => {
			const injector = createTestInjector();
			const fs = getFileSystemMock(injector);
			fs.readText = (
				filename: string,
				options?: IReadFileOptions | string,
			): string => {
				return `// DEVELOPMENT_TEAM = YOUR_TEAM_ID;
						ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;`;
			};

			const expected = {
				ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
				DEVELOPMENT_TEAM: <any>null,
			};

			assertPropertyValues(expected, injector);
		});

		it("Returns correct empty value.", () => {
			const injector = createTestInjector();
			const fs = getFileSystemMock(injector);
			fs.readText = (
				filename: string,
				options?: IReadFileOptions | string,
			): string => {
				return `
						ASSETCATALOG_COMPILER_APPICON_NAME = ;
						ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME = LaunchImage;
						`;
			};

			const expected = {
				ASSETCATALOG_COMPILER_APPICON_NAME: "",
				ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME: "LaunchImage",
			};

			assertPropertyValues(expected, injector);
		});

		it("First part only property doesn't break the service.", () => {
			const injector = createTestInjector();
			const fs = getFileSystemMock(injector);
			fs.readText = (
				filename: string,
				options?: IReadFileOptions | string,
			): string => {
				return `ASSETCATALOG_COMPILER_APPICON_NAME`;
			};

			const expected = {
				ASSETCATALOG_COMPILER_APPICON_NAME: <any>null,
			};

			assertPropertyValues(expected, injector);
		});

		it("Invalid config property value with = doesn't break the service.", () => {
			const injector = createTestInjector();
			const fs = getFileSystemMock(injector);
			fs.readText = (
				filename: string,
				options?: IReadFileOptions | string,
			): string => {
				return `ASSETCATALOG_COMPILER_APPICON_NAME=`;
			};

			const expected = {
				ASSETCATALOG_COMPILER_APPICON_NAME: <any>null,
			};

			assertPropertyValues(expected, injector);
		});

		it("Property with space is read correctly.", () => {
			const injector = createTestInjector();
			const fs = getFileSystemMock(injector);
			fs.readText = (
				filename: string,
				options?: IReadFileOptions | string,
			): string => {
				return `ASSETCATALOG_COMPILER_APPICON_NAME= `;
			};

			const expected = {
				ASSETCATALOG_COMPILER_APPICON_NAME: "",
			};

			assertPropertyValues(expected, injector);
		});

		it("Ensure property can be an empty value.", () => {
			const injector = createTestInjector();
			const fs = getFileSystemMock(injector);
			fs.readText = (
				filename: string,
				options?: IReadFileOptions | string,
			): string => {
				return `ASSETCATALOG_COMPILER_APPICON_NAME= ;`;
			};

			const expected = {
				ASSETCATALOG_COMPILER_APPICON_NAME: "",
			};

			assertPropertyValues(expected, injector);
		});
	});
});
