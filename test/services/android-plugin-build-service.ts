import { AndroidPluginBuildService } from "../../lib/services/android-plugin-build-service";
import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import * as FsLib from "../../lib/common/file-system";
import * as path from "path";
import { HostInfo } from "../../lib/common/host-info";
import { Logger } from "../../lib/common/logger";
import * as ErrorsLib from "../../lib/common/errors";
import temp = require("temp");
import { INCLUDE_GRADLE_NAME } from "../../lib/constants";
temp.track();

describe('androiPluginBuildService', () => {

	let execCalled = false;
	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();

		testInjector.register("fs", FsLib.FileSystem);
		testInjector.register("childProcess", {
			exec: () => {
				execCalled = true;
			}
		});
		testInjector.register("hostInfo", HostInfo);
		testInjector.register("androidToolsInfo", {
			getToolsInfo: () => {
				return {};
			},
			validateInfo: () => {
				return true;
			}
		});
		testInjector.register("logger", Logger);
		testInjector.register("errors", ErrorsLib.Errors);
		testInjector.register("options", {});
		testInjector.register("config", {});
		testInjector.register("staticConfig", {});

		return testInjector;
	};

	let testInjector: IInjector;
	let fs: IFileSystem;
	let androidBuildPluginService: AndroidPluginBuildService;
	let tempFolder: string;
	let pluginFolder: string;

	function setUpIncludeGradle() {
		fs = testInjector.resolve("fs");
		pluginFolder = temp.mkdirSync("AndroidProjectPropertiesManager-temp");

		const validIncludeGradleContent = `android {
	productFlavors {
		"nativescript-pro-ui" {
			dimension "nativescript-pro-ui"
		}
	}
}

def supportVersion = project.hasProperty("supportVersion") ? project.supportVersion : "23.3.0"

dependencies {
	compile "com.android.support:appcompat-v7:$supportVersion"
	compile "com.android.support:recyclerview-v7:$supportVersion"
	compile "com.android.support:design:$supportVersion"
}`;

		fs.writeFile(path.join(pluginFolder, INCLUDE_GRADLE_NAME), validIncludeGradleContent);
	}

	function setUpPluginNativeFolder(manifestFile: boolean, resFolder: boolean, assetsFolder: boolean) {
		fs = testInjector.resolve("fs");
		tempFolder = temp.mkdirSync("AndroidProjectPropertiesManager");
		pluginFolder = temp.mkdirSync("AndroidProjectPropertiesManager-temp");

		const validAndroidManifestContent = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
</manifest>`;
		const validStringsXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
	<string
		name="string_name"
		>text_string</string>
</resources>`;

		if (manifestFile) {
			fs.writeFile(path.join(tempFolder, "AndroidManifest.xml"), validAndroidManifestContent);
		}

		if (resFolder) {
			const valuesFolder = path.join(tempFolder, "res", "values");
			fs.createDirectory(valuesFolder);
			fs.writeFile(path.join(valuesFolder, "strings.xml"), validStringsXmlContent);
		}

		if (assetsFolder) {
			const imagesFolder = path.join(tempFolder, "assets", "images");
			fs.createDirectory(imagesFolder);
			fs.writeFile(path.join(imagesFolder, "myicon.png"), "123");
		}
	}

	before(() => {
		testInjector = createTestInjector();
		androidBuildPluginService = testInjector.resolve<AndroidPluginBuildService>(AndroidPluginBuildService);
	});

	beforeEach(() => {
		execCalled = false;
	});

	describe('builds aar', () => {

		it('if supported files are in plugin', async () => {
			setUpPluginNativeFolder(true, true, true);
			const config: IBuildOptions = {
				platformsAndroidDirPath: tempFolder,
				pluginName: "my-plugin",
				aarOutputDir: tempFolder,
				tempPluginDirPath: pluginFolder
			};

			try {
				await androidBuildPluginService.buildAar(config);
			} catch (e) {
				/* intentionally left blank */
			}

			assert.isTrue(execCalled);
		});

		it('if android manifest is missing', async () => {
			setUpPluginNativeFolder(false, true, true);
			const config: IBuildOptions = {
				platformsAndroidDirPath: tempFolder,
				pluginName: "my-plugin",
				aarOutputDir: tempFolder,
				tempPluginDirPath: pluginFolder
			};

			try {
				await androidBuildPluginService.buildAar(config);
			} catch (e) {
				/* intentionally left blank */
			}

			assert.isTrue(execCalled);
		});

		it('if there is only an android manifest file', async () => {
			setUpPluginNativeFolder(true, false, false);
			const config: IBuildOptions = {
				platformsAndroidDirPath: tempFolder,
				pluginName: "my-plugin",
				aarOutputDir: tempFolder,
				tempPluginDirPath: pluginFolder
			};

			try {
				await androidBuildPluginService.buildAar(config);
			} catch (e) {
				/* intentionally left blank */
			}

			assert.isTrue(execCalled);
		});
	});

	describe(`doesn't build aar `, () => {
		it('if there are no files', async () => {
			setUpPluginNativeFolder(false, false, false);
			const config: IBuildOptions = {
				platformsAndroidDirPath: tempFolder,
				pluginName: "my-plugin",
				aarOutputDir: tempFolder,
				tempPluginDirPath: pluginFolder
			};

			try {
				await androidBuildPluginService.buildAar(config);
			} catch (e) {
				/* intentionally left blank */
			}

			assert.isFalse(execCalled);
		});
	});

	describe(`handles include.gradle`, () => {
		it('if there is a legacy include.gradle file', async () => {
			setUpIncludeGradle();
			const config: IBuildOptions = {
				platformsAndroidDirPath: pluginFolder,
				pluginName: "my-plugin",
				aarOutputDir: pluginFolder,
				tempPluginDirPath: pluginFolder
			};

			const includeGradleName = INCLUDE_GRADLE_NAME;
			await androidBuildPluginService.migrateIncludeGradle(config);
			const includeGradleContent = fs.readText(path.join(pluginFolder, includeGradleName).toString());
			const productFlavorsAreRemoved = includeGradleContent.indexOf("productFlavors") === -1;
			assert.isTrue(productFlavorsAreRemoved);
		});
	});
});
