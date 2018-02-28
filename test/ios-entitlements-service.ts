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
		testInjector.register('projectData', stubs.ProjectDataStub);
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

	let injector: IInjector;
	let platformsData: any;
	let projectData: IProjectData;
	let fs: IFileSystem;
	let iOSEntitlementsService: IOSEntitlementsService;
	let destinationFilePath: string;

	beforeEach(() => {
		injector = createTestInjector();

		platformsData = injector.resolve("platformsData");
		projectData = injector.resolve("projectData");
		projectData.projectName = 'testApp';

		projectData.platformsDir = temp.mkdirSync("platformsDir");
		projectData.projectDir = temp.mkdirSync("projectDir");
		projectData.appDirectoryPath = projectData.getAppDirectoryPath();
		projectData.appResourcesDirectoryPath = projectData.getAppResourcesDirectoryPath();

		fs = injector.resolve("$fs");

		iOSEntitlementsService = injector.resolve("iOSEntitlementsService");
		destinationFilePath = iOSEntitlementsService.getPlatformsEntitlementsPath(projectData);
	});

	describe("Ensure paths constructed are correct", () => {
		it("Ensure destination entitlements relative path is calculated correctly.", () => {
			const expected = path.join("testApp", "testApp.entitlements");
			const actual = iOSEntitlementsService.getPlatformsEntitlementsRelativePath(projectData);
			assert.equal(actual, expected);
		});

		it("Ensure full path to entitlements in platforms dir is correct", () => {
			const expected = path.join(projectData.platformsDir, "ios", "testApp", "testApp.entitlements");
			const actual = iOSEntitlementsService.getPlatformsEntitlementsPath(projectData);
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
			const strip = (x: string) => {
				return x.replace(EOL, '').trim();
			};
			assert.equal(strip(actual), strip(expected));
		}

		it("Merge creates a default entitlements file.", async () => {
			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			const actual = fs.readText(destinationFilePath);
			assertContent(actual, defaultPlistContent);
		});

		it("Merge uses the entitlements from App_Resources folder", async () => {
			const appResourcesEntitlement = (<any>iOSEntitlementsService).getDefaultAppEntitlementsPath(projectData);
			fs.writeFile(appResourcesEntitlement, defaultAppResourcesEntitlementsContent);

			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			const actual = fs.readText(destinationFilePath);
			assertContent(actual, defaultAppResourcesEntitlementsContent);
		});

		it("Merge uses the entitlements file from a Plugin", async () => {
			const pluginsService = injector.resolve("pluginsService");
			const testPluginFolderPath = temp.mkdirSync("testPlugin");
			pluginsService.getAllInstalledPlugins = async () => [{
				pluginPlatformsFolderPath: (platform: string) => {
					return testPluginFolderPath;
				}
			}];
			const pluginAppEntitlementsPath = path.join(testPluginFolderPath, IOSEntitlementsService.DefaultEntitlementsName);
			fs.writeFile(pluginAppEntitlementsPath, defaultPluginEntitlementsContent);

			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			const actual = fs.readText(destinationFilePath);
			assertContent(actual, defaultPluginEntitlementsContent);
		});

		it("Merge uses App_Resources and Plugins and merges all keys", async () => {
			// setup app resoruces
			const appResourcesEntitlement = (<any>iOSEntitlementsService).getDefaultAppEntitlementsPath(projectData);
			fs.writeFile(appResourcesEntitlement, namedAppResourcesEntitlementsContent);

			// setup plugin entitlements
			const pluginsService = injector.resolve("pluginsService");
			const testPluginFolderPath = temp.mkdirSync("testPlugin");
			pluginsService.getAllInstalledPlugins = async () => [{
				pluginPlatformsFolderPath: (platform: string) => {
					return testPluginFolderPath;
				}
			}];
			const pluginAppEntitlementsPath = path.join(testPluginFolderPath, IOSEntitlementsService.DefaultEntitlementsName);
			fs.writeFile(pluginAppEntitlementsPath, defaultPluginEntitlementsContent);

			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			const actual = fs.readText(destinationFilePath);
			assertContent(actual, mergedEntitlementsContent);
		});
	});
});
