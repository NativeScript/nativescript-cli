import temp = require("temp");
import { assert } from "chai";
import { XCConfigService } from "../lib/services/xcconfig-service";
import * as yok from "../lib/common/yok";

// start tracking temporary folders/files
temp.track();

describe("XCConfig Service Tests", () => {
	const createTestInjector = (): IInjector => {
		const testInjector = new yok.Yok();
		testInjector.register("fs", {
			exists: (path: string) => {
				return true;
			}
		});

		testInjector.register('xCConfigService', XCConfigService);

		return testInjector;
	};

	const assertPropertyValues = (expected: any, injector: IInjector) => {
		let service = getXCConfigService(injector);
		_.forOwn(expected, (value, key) => {
			let actual = service.readPropertyValue("any", key);
			assert.equal(actual, value);
		});
	};

	function getXCConfigService(injector: IInjector): XCConfigService {
		return injector.resolve("xCConfigService");
	}

	function getFileSystemMock(injector: IInjector): any {
		return injector.resolve('$fs');
	}

	describe("Read Property Value", () => {
		it("Return empty value, for unexistent file", () => {
			let injector = createTestInjector();
			injector.register("fs", {
				exists: (path: string) => {
					return false;
				}
			});

			let service = getXCConfigService(injector);
			let actual = service.readPropertyValue("any", "any");

			assert.isNull(actual);
		});

		it("Returns correct value for well-formatted document", () => {
			let injector = createTestInjector();
			let fs = getFileSystemMock(injector);
			fs.readText = (filename: string, options?: IReadFileOptions | string): string => {
				return `// You can add custom settings here
						// for example you can uncomment the following line to force distribution code signing
						CODE_SIGN_IDENTITY = iPhone Distribution
						// To build for device with XCode 8 you need to specify your development team. More info: https://developer.apple.com/library/prerelease/content/releasenotes/DeveloperTools/RN-Xcode/Introduction.html
						// DEVELOPMENT_TEAM = YOUR_TEAM_ID;
						ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
						ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME = LaunchImage;`;
			};

			let expected = {
				'ASSETCATALOG_COMPILER_APPICON_NAME': 'AppIcon',
				'ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME': 'LaunchImage',
				'CODE_SIGN_IDENTITY': 'iPhone Distribution'
			};

			assertPropertyValues(expected, injector);
		});

		it("Returns correct value for values with missing ; at the end of the line.", () => {
			let injector = createTestInjector();
			let fs = getFileSystemMock(injector);
			fs.readText = (filename: string, options?: IReadFileOptions | string): string => {
				return `// You can add custom settings here
						// for example you can uncomment the following line to force distribution code signing
						CODE_SIGN_IDENTITY = iPhone Distribution
						// To build for device with XCode 8 you need to specify your development team. More info: https://developer.apple.com/library/prerelease/content/releasenotes/DeveloperTools/RN-Xcode/Introduction.html
						// DEVELOPMENT_TEAM = YOUR_TEAM_ID
						ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon
						ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME = LaunchImage`;
			};

			let expected = {
				'ASSETCATALOG_COMPILER_APPICON_NAME': 'AppIcon',
				'ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME': 'LaunchImage',
				'CODE_SIGN_IDENTITY': 'iPhone Distribution'
			};

			assertPropertyValues(expected, injector);
		});

		it("Doesn't read value from a commented-out line.", () => {
			let injector = createTestInjector();
			let fs = getFileSystemMock(injector);
			fs.readText = (filename: string, options?: IReadFileOptions | string): string => {
				return `// DEVELOPMENT_TEAM = YOUR_TEAM_ID;
						ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;`;
			};

			let expected = {
				'ASSETCATALOG_COMPILER_APPICON_NAME': 'AppIcon',
				'DEVELOPMENT_TEAM': <any>null
			};

			assertPropertyValues(expected, injector);
		});

		it("Returns correct empty value.", () => {
			let injector = createTestInjector();
			let fs = getFileSystemMock(injector);
			fs.readText = (filename: string, options?: IReadFileOptions | string): string => {
				return `
						ASSETCATALOG_COMPILER_APPICON_NAME = ;
						ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME = LaunchImage;
						`;
			};

			let expected = {
				'ASSETCATALOG_COMPILER_APPICON_NAME': '',
				'ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME': 'LaunchImage'
			};

			assertPropertyValues(expected, injector);
		});

		it("First part only property doesn't break the service.", () => {
			let injector = createTestInjector();
			let fs = getFileSystemMock(injector);
			fs.readText = (filename: string, options?: IReadFileOptions | string): string => {
				return `ASSETCATALOG_COMPILER_APPICON_NAME`;
			};

			let expected = {
				'ASSETCATALOG_COMPILER_APPICON_NAME': <any>null
			};

			assertPropertyValues(expected, injector);
		});

		it("Invalid config property value with = doesn't break the service.", () => {
			let injector = createTestInjector();
			let fs = getFileSystemMock(injector);
			fs.readText = (filename: string, options?: IReadFileOptions | string): string => {
				return `ASSETCATALOG_COMPILER_APPICON_NAME=`;
			};

			let expected = {
				'ASSETCATALOG_COMPILER_APPICON_NAME': <any>null
			};

			assertPropertyValues(expected, injector);
		});

		it("Property with space is read correctly.", () => {
			let injector = createTestInjector();
			let fs = getFileSystemMock(injector);
			fs.readText = (filename: string, options?: IReadFileOptions | string): string => {
				return `ASSETCATALOG_COMPILER_APPICON_NAME= `;
			};

			let expected = {
				'ASSETCATALOG_COMPILER_APPICON_NAME': ''
			};

			assertPropertyValues(expected, injector);
		});

		it("Ensure property can be an empty value.", () => {
			let injector = createTestInjector();
			let fs = getFileSystemMock(injector);
			fs.readText = (filename: string, options?: IReadFileOptions | string): string => {
				return `ASSETCATALOG_COMPILER_APPICON_NAME= ;`;
			};

			let expected = {
				'ASSETCATALOG_COMPILER_APPICON_NAME': ''
			};

			assertPropertyValues(expected, injector);
		});
	});
});
