import { AndroidPluginBuildService } from "../../lib/services/android-plugin-build-service";
import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import * as FsLib from "../../lib/common/file-system";
import * as path from "path";
import { ChildProcess } from "../../lib/common/child-process";
import { HostInfo } from "../../lib/common/host-info";
import { AndroidToolsInfo } from "../../lib/android-tools-info";
import { Logger } from "../../lib/common/logger";
import * as ErrorsLib from "../../lib/common/errors";
import temp = require("temp");
temp.track();

describe('androiPluginBuildService', () => {

	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();

		testInjector.register("fs", FsLib.FileSystem);
		testInjector.register("childProcess", ChildProcess);
		testInjector.register("hostInfo", HostInfo);
		testInjector.register("androidToolsInfo", AndroidToolsInfo);
		testInjector.register("logger", Logger);
		testInjector.register("errors", ErrorsLib);
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

		fs.writeFile(path.join(pluginFolder, "include.gradle"), validIncludeGradleContent);
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

	describe('builds aar', () => {

		it('if supported files are in plugin', async () => {
			setUpPluginNativeFolder(true, true, true);
			const config: IBuildOptions = {
				platformsAndroidDirPath: tempFolder,
				pluginName: "my-plugin",
				aarOutputDir: tempFolder,
				tempPluginDirPath: pluginFolder
			};

			const expectedAarName = "my_plugin.aar";
			await androidBuildPluginService.buildAar(config);
			const hasGeneratedAar = fs.exists(path.join(tempFolder, expectedAarName));

			assert.isTrue(hasGeneratedAar);
		});

		it('if android manifest is missing', async () => {
			setUpPluginNativeFolder(false, true, true);
			const config: IBuildOptions = {
				platformsAndroidDirPath: tempFolder,
				pluginName: "my-plugin",
				aarOutputDir: tempFolder,
				tempPluginDirPath: pluginFolder
			};

			const expectedAarName = "my_plugin.aar";
			await androidBuildPluginService.buildAar(config);
			const hasGeneratedAar = fs.exists(path.join(tempFolder, expectedAarName));

			assert.isTrue(hasGeneratedAar);
		});

		it('if there is only an android manifest file', async () => {
			setUpPluginNativeFolder(true, false, false);
			const config: IBuildOptions = {
				platformsAndroidDirPath: tempFolder,
				pluginName: "my-plugin",
				aarOutputDir: tempFolder,
				tempPluginDirPath: pluginFolder
			};

			const expectedAarName = "my_plugin.aar";
			await androidBuildPluginService.buildAar(config);
			const hasGeneratedAar = fs.exists(path.join(tempFolder, expectedAarName));

			assert.isTrue(hasGeneratedAar);
		});
	});

	describe(`doesn't build aar `, () => {
		it('if there is only an android manifest file', async () => {
			setUpPluginNativeFolder(false, false, false);
			const config: IBuildOptions = {
				platformsAndroidDirPath: tempFolder,
				pluginName: "my-plugin",
				aarOutputDir: tempFolder,
				tempPluginDirPath: pluginFolder
			};

			const expectedAarName = "my_plugin.aar";
			await androidBuildPluginService.buildAar(config);
			const hasGeneratedAar = fs.exists(path.join(tempFolder, expectedAarName));

			assert.equal(hasGeneratedAar, false);
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

			const includeGradleName = "include.gradle";
			await androidBuildPluginService.migrateIncludeGradle(config);
			const includeGradleContent = fs.readText(path.join(pluginFolder, includeGradleName).toString());
			const productFlavorsAreRemoved = includeGradleContent.indexOf("productFlavors") === -1;
			assert.equal(productFlavorsAreRemoved, true);
		});
	});
});
