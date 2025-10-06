import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { EOL } from "os";
import { assert } from "chai";
import { IOSEntitlementsService } from "../lib/services/ios-entitlements-service";
import * as yok from "../lib/common/yok";
import * as stubs from "./stubs";
import * as FsLib from "../lib/common/file-system";
import * as MobileHelperLib from "../lib/common/mobile/mobile-helper";
import * as DevicePlatformsConstantsLib from "../lib/common/mobile/device-platforms-constants";
import * as ErrorsLib from "../lib/common/errors";
import * as path from "path";
import { IProjectData } from "../lib/definitions/project";
import { IInjector } from "../lib/common/definitions/yok";
import { IFileSystem } from "../lib/common/declarations";

// start temporary folders/files helpers

describe("IOSEntitlements Service Tests", () => {
	const createTestInjector = (): IInjector => {
		const testInjector = new yok.Yok();

		testInjector.register("platformsDataService", stubs.NativeProjectDataStub);
		testInjector.register("projectData", stubs.ProjectDataStub);
		testInjector.register("logger", stubs.LoggerStub);
		testInjector.register("iOSEntitlementsService", IOSEntitlementsService);

		testInjector.register("fs", FsLib.FileSystem);
		testInjector.register("mobileHelper", MobileHelperLib.MobileHelper);
		testInjector.register(
			"devicePlatformsConstants",
			DevicePlatformsConstantsLib.DevicePlatformsConstants,
		);
		testInjector.register("errors", ErrorsLib.Errors);

		testInjector.register("pluginsService", {
			getAllInstalledPlugins: async (): Promise<any[]> => [],
		});

		testInjector.register("tempService", stubs.TempServiceStub);

		testInjector.register("options", {});

		return testInjector;
	};

	let injector: IInjector;
	let projectData: IProjectData;
	let fs: IFileSystem;
	let iOSEntitlementsService: IOSEntitlementsService;
	let destinationFilePath: string;

	beforeEach(() => {
		injector = createTestInjector();

		projectData = injector.resolve<IProjectData>("projectData");
		projectData.projectName = "testApp";

		projectData.platformsDir = mkdtempSync(
			path.join(tmpdir(), "platformsDir-"),
		);
		projectData.projectDir = mkdtempSync(path.join(tmpdir(), "projectDir-"));
		projectData.appDirectoryPath = projectData.getAppDirectoryPath();
		projectData.appResourcesDirectoryPath =
			projectData.getAppResourcesDirectoryPath();

		fs = injector.resolve("$fs");

		iOSEntitlementsService = injector.resolve("iOSEntitlementsService");
		destinationFilePath =
			iOSEntitlementsService.getPlatformsEntitlementsPath(projectData);
	});

	describe("Ensure paths constructed are correct", () => {
		it("Ensure destination entitlements relative path is calculated correctly.", () => {
			const expected = path.join("testApp", "testApp.entitlements");
			const actual =
				iOSEntitlementsService.getPlatformsEntitlementsRelativePath(
					projectData,
				);
			assert.equal(actual, expected);
		});

		it("Ensure full path to entitlements in platforms dir is correct", () => {
			const expected = path.join(
				projectData.platformsDir,
				"ios",
				"testApp",
				"testApp.entitlements",
			);
			const actual =
				iOSEntitlementsService.getPlatformsEntitlementsPath(projectData);
			assert.equal(actual, expected);
		});
	});

	describe("Merge", () => {
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
				return x.replace(EOL, "").trim();
			};
			assert.equal(strip(actual), strip(expected));
		}

		it("Merge does not create a default entitlements file.", async () => {
			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			assert.isFalse(fs.exists(destinationFilePath));
		});

		it("Merge uses the entitlements from App_Resources folder", async () => {
			const appResourcesEntitlement = (<any>(
				iOSEntitlementsService
			)).getDefaultAppEntitlementsPath(projectData);
			fs.writeFile(
				appResourcesEntitlement,
				defaultAppResourcesEntitlementsContent,
			);

			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			const actual = fs.readText(destinationFilePath);
			assertContent(actual, defaultAppResourcesEntitlementsContent);
		});

		it("Merge uses the entitlements file from a Plugin", async () => {
			const pluginsService = injector.resolve("pluginsService");
			const testPluginFolderPath = mkdtempSync(
				path.join(tmpdir(), "testPlugin-"),
			);
			pluginsService.getAllInstalledPlugins = async () => [
				{
					pluginPlatformsFolderPath: (platform: string) => {
						return testPluginFolderPath;
					},
				},
			];
			const pluginAppEntitlementsPath = path.join(
				testPluginFolderPath,
				IOSEntitlementsService.DefaultEntitlementsName,
			);
			fs.writeFile(pluginAppEntitlementsPath, defaultPluginEntitlementsContent);

			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			const actual = fs.readText(destinationFilePath);
			assertContent(actual, defaultPluginEntitlementsContent);
		});

		it("Merge uses App_Resources and Plugins and merges all keys", async () => {
			// setup app resoruces
			const appResourcesEntitlement = (<any>(
				iOSEntitlementsService
			)).getDefaultAppEntitlementsPath(projectData);
			fs.writeFile(
				appResourcesEntitlement,
				namedAppResourcesEntitlementsContent,
			);

			// setup plugin entitlements
			const pluginsService = injector.resolve("pluginsService");
			const testPluginFolderPath = mkdtempSync(
				path.join(tmpdir(), "testPlugin-"),
			);
			pluginsService.getAllInstalledPlugins = async () => [
				{
					pluginPlatformsFolderPath: (platform: string) => {
						return testPluginFolderPath;
					},
				},
			];
			const pluginAppEntitlementsPath = path.join(
				testPluginFolderPath,
				IOSEntitlementsService.DefaultEntitlementsName,
			);
			fs.writeFile(pluginAppEntitlementsPath, defaultPluginEntitlementsContent);

			// act
			await iOSEntitlementsService.merge(projectData);

			// assert
			const actual = fs.readText(destinationFilePath);
			assertContent(actual, mergedEntitlementsContent);
		});
	});
});
