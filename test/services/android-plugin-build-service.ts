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
import * as stubs from "../stubs";
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
import { getShortPluginName } from "../../lib/common/helpers";

temp.track();

describe.only('androiPluginBuildService', () => {
	let spawnFromEventCalled = false;
	let testInjector: IInjector;
	let fs: IFileSystem;
	let androidBuildPluginService: AndroidPluginBuildService;
	let tempFolder: string;
	let pluginFolder: string;

	function setupTestInjector(): IInjector {
		testInjector = new Yok();
		testInjector.register("fs", FsLib.FileSystem);
		testInjector.register("childProcess", {
			spawnFromEvent: async (command: string, args: string[], event: string, options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> => {
				const finalAarName = `${getShortPluginName("my-plugin")}-release.aar`;
				const aar = path.join(pluginFolder, getShortPluginName("my-plugin"), "build", "outputs", "aar", finalAarName);
				fs.writeFile(aar, "");
				spawnFromEventCalled = command.indexOf("gradlew") !== -1;
				return null;
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
		testInjector.register("hooksService", {
			executeBeforeHooks: async (commandName: string, hookArguments?: IDictionary<any>): Promise<void> => undefined,
			executeAfterHooks: async (commandName: string, hookArguments?: IDictionary<any>): Promise<void> => undefined
		});
		testInjector.register('projectDataService', stubs.ProjectDataService);
		testInjector.register('platformService', {
			getCurrentPlatformVersion: (platform: string, projectData: IProjectData): string => {
				console.log("here?");
				return "4.1.2";
			}
		});
		testInjector.register('devicePlatformsConstants', DevicePlatformsConstants);
		setupNpm();

		return testInjector;
	}

	function setupNpm(gradleVersion?: string, gradleAndroidVersion?: string): void {
		testInjector.register('npm', {
			getRegistryPackageData: async (packageName: string): Promise<any> => {
				const result: any = [];
				result["dist-tags"] = { latest: '1.0.0' };
				result.versions = [];
				result.versions['1.0.0'] = {
					"name": packageName,
					"gradle": {
						"version": gradleVersion || "1.0.0",
						"android": gradleAndroidVersion || "1.0.0"
					}
				};
				result.versions['4.1.2'] = {
					"name": packageName,
					"gradle": {
						"version": "1.0.0",
						"android": "1.0.0"
					}
				};

				return result;
			}
		});
	}

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
		setupTestInjector();
		androidBuildPluginService = testInjector.resolve<AndroidPluginBuildService>(AndroidPluginBuildService);
	});

	beforeEach(() => {
		spawnFromEventCalled = false;
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

			assert.isTrue(spawnFromEventCalled);
		});

		it('should use the latest runtime gradle versions when no project dir specified', async () => {
			const gradleVersion = "1.2.3";
			const gradleAndroidPluginVersion = "4.5.6";
			setupNpm(gradleVersion, gradleAndroidPluginVersion);
			androidBuildPluginService = testInjector.resolve<AndroidPluginBuildService>(AndroidPluginBuildService);
			setUpPluginNativeFolder(true, false, false);
			const config: IBuildOptions = {
				platformsAndroidDirPath: tempFolder,
				pluginName: "my-plugin",
				aarOutputDir: tempFolder,
				tempPluginDirPath: pluginFolder
			};

			await androidBuildPluginService.buildAar(config);

			const gradleWrappersContent = fs.readText(path.join(pluginFolder, getShortPluginName("my-plugin"), "build.gradle").toString());
			const androidVersionRegex = /com\.android\.tools\.build\:gradle\:(.*)\'\n/g;
			const actualAndroidVersion = androidVersionRegex.exec(gradleWrappersContent)[1];
			assert.equal(actualAndroidVersion, gradleAndroidPluginVersion);

			const buildGradleContent = fs.readText(
				path.join(pluginFolder, getShortPluginName("my-plugin"), "gradle", "wrapper", "gradle-wrapper.properties").toString());
			const gradleVersionRegex = /gradle\-(.*)\-bin\.zip\n/g;
			const actualGradleVersion = gradleVersionRegex.exec(buildGradleContent)[1];
			assert.equal(actualGradleVersion, gradleVersion);

			assert.isTrue(spawnFromEventCalled);
		});

		it.only('should use specified runtime gradle versions from the project dir', async () => {
			const gradleVersion = "1.2.3";
			const gradleAndroidPluginVersion = "4.5.6";
			setupNpm(gradleVersion, gradleAndroidPluginVersion);
			androidBuildPluginService = testInjector.resolve<AndroidPluginBuildService>(AndroidPluginBuildService);
			setUpPluginNativeFolder(true, false, false);
			const config: IBuildOptions = {
				platformsAndroidDirPath: tempFolder,
				pluginName: "my-plugin",
				aarOutputDir: tempFolder,
				tempPluginDirPath: pluginFolder,
				projectDir: tempFolder
			};

			await androidBuildPluginService.buildAar(config);

			const gradleWrappersContent = fs.readText(path.join(pluginFolder, getShortPluginName("my-plugin"), "build.gradle").toString());
			const androidVersionRegex = /com\.android\.tools\.build\:gradle\:(.*)\'\n/g;
			const actualAndroidVersion = androidVersionRegex.exec(gradleWrappersContent)[1];
			assert.equal(actualAndroidVersion, "1.0.0");

			const buildGradleContent = fs.readText(
				path.join(pluginFolder, getShortPluginName("my-plugin"), "gradle", "wrapper", "gradle-wrapper.properties").toString());
			const gradleVersionRegex = /gradle\-(.*)\-bin\.zip\n/g;
			const actualGradleVersion = gradleVersionRegex.exec(buildGradleContent)[1];
			assert.equal(actualGradleVersion, "1.0.0");

			assert.isTrue(spawnFromEventCalled);
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

			assert.isTrue(spawnFromEventCalled);
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

			assert.isTrue(spawnFromEventCalled);
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

			assert.isFalse(spawnFromEventCalled);
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
