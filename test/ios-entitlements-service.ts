import temp = require("temp");
import { EOL } from "os";
import { assert } from "chai";
import { IOSEntitlementsService } from "../lib/services/ios-entitlements-service";
import * as yok from "../lib/common/yok";
import * as stubs from "./stubs";
import * as FsLib from "../lib/common/file-system";
import * as MobilePlatformsCapabilitiesLib from "../lib/common/appbuilder/mobile-platforms-capabilities";
import * as MobileHelperLib from "../lib/common/mobile/mobile-helper";
import * as DevicePlatformsConstantsLib from "../lib/common/mobile/device-platforms-constants";
import * as ErrorsLib from "../lib/common/errors";
import * as path from "path";

// start tracking temporary folders/files
temp.track();

describe("IOSEntitlements Service Tests", () => {
	const createTestInjector = (): IInjector => {
		const testInjector = new yok.Yok();

		testInjector.register('platformsData', stubs.PlatformsDataStub);
		testInjector.register("logger", stubs.LoggerStub);
		testInjector.register('iOSEntitlementsService', IOSEntitlementsService);

		testInjector.register("fs", FsLib.FileSystem);
		testInjector.register("mobileHelper", MobileHelperLib.MobileHelper);
		testInjector.register("devicePlatformsConstants", DevicePlatformsConstantsLib.DevicePlatformsConstants);
		testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilitiesLib.MobilePlatformsCapabilities);
		testInjector.register("errors", ErrorsLib.Errors);

		testInjector.register("pluginsService", {
			getAllInstalledPlugins: async (): Promise<any[]> => []
		});

		return testInjector;
	};

	let injector: IInjector,
		platformsData: any,
		projectData: IProjectData,
		fs: IFileSystem,
		iOSEntitlementsService: IOSEntitlementsService,
		destinationFilePath: string;

	beforeEach(() => {
		injector = createTestInjector();

		platformsData = injector.resolve("platformsData");
		projectData = <IProjectData>platformsData.getPlatformData();
		projectData.projectName = 'testApp';

		projectData.platformsDir = temp.mkdirSync("platformsDir");
		projectData.projectDir = temp.mkdirSync("projectDir");

		fs = injector.resolve("$fs");

		iOSEntitlementsService = injector.resolve("iOSEntitlementsService");
		destinationFilePath = iOSEntitlementsService.getPlatformsEntitlementsPath(projectData);
	});

	describe("Ensure paths constructed are correct", () => {
		it("Ensure destination entitlements relative path is calculated correctly.", () => {
			const expected = path.join("testApp", "testApp.entitlements");
			let actual = iOSEntitlementsService.getPlatformsEntitlementsRelativePath(projectData);
			assert.equal(actual, expected);
		});
	});

	describe("Merge", () => {
		const defaultPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict/>
</plist>`;
		const defaultAppResourcesEntitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>aps-environment</key>
    <string>development</string>
  </dict>
</plist>`;
		const defaultPluginEntitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>aps-environment</key>
    <string>production</string>
  </dict>
</plist>`;
		const namedAppResourcesEntitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>nameKey</key>
    <string>appResources</string>
  </dict>
</plist>`;
		const mergedEntitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>aps-environment</key>
    <string>production</string>
    <key>nameKey</key>
    <string>appResources</string>
  </dict>
</plist>`;

		function assertContent(actual: string, expected: string) {
			let strip = (x: string) => {
				return x.replace(EOL, '').trim();
			};
			assert.equal(strip(actual), strip(expected));
		}

		it("Merge creates a default entitlements file.", async () => {
			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			let actual = fs.readText(destinationFilePath);
			assertContent(actual, defaultPlistContent);
		});

		it("Merge uses the entitlements from App_Resources folder", async () => {
			let appResourcesEntitlement = (<any>iOSEntitlementsService).getDefaultAppEntitlementsPath(projectData);
			fs.writeFile(appResourcesEntitlement, defaultAppResourcesEntitlementsContent);

			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			let actual = fs.readText(destinationFilePath);
			assertContent(actual, defaultAppResourcesEntitlementsContent);
		});

		it("Merge uses the entitlements file from a Plugin", async () => {
			let pluginsService = injector.resolve("pluginsService");
			let testPluginFolderPath = temp.mkdirSync("testPlugin");
			pluginsService.getAllInstalledPlugins = async () => [{
				pluginPlatformsFolderPath: (platform: string) => {
					return testPluginFolderPath;
				}
			}];
			let pluginAppEntitlementsPath = path.join(testPluginFolderPath, IOSEntitlementsService.DefaultEntitlementsName);
			fs.writeFile(pluginAppEntitlementsPath, defaultPluginEntitlementsContent);

			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			let actual = fs.readText(destinationFilePath);
			assertContent(actual, defaultPluginEntitlementsContent);
		});

		it("Merge uses App_Resources and Plugins and merges all keys", async () => {
			// setup app resoruces
			let appResourcesEntitlement = (<any>iOSEntitlementsService).getDefaultAppEntitlementsPath(projectData);
			fs.writeFile(appResourcesEntitlement, namedAppResourcesEntitlementsContent);

			// setup plugin entitlements
			let pluginsService = injector.resolve("pluginsService");
			let testPluginFolderPath = temp.mkdirSync("testPlugin");
			pluginsService.getAllInstalledPlugins = async () => [{
				pluginPlatformsFolderPath: (platform: string) => {
					return testPluginFolderPath;
				}
			}];
			let pluginAppEntitlementsPath = path.join(testPluginFolderPath, IOSEntitlementsService.DefaultEntitlementsName);
			fs.writeFile(pluginAppEntitlementsPath, defaultPluginEntitlementsContent);

			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			let actual = fs.readText(destinationFilePath);
			assertContent(actual, mergedEntitlementsContent);
		});
	});
});
