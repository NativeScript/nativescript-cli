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

describe.only('androidPluginBuildService', () => {
	const pluginName = 'my-plugin';
	const shortPluginName = getShortPluginName(pluginName);
	let spawnFromEventCalled = false;
	let fs: IFileSystem;
	let androidBuildPluginService: AndroidPluginBuildService;
	let tempFolder: string;
	let pluginFolder: string;

	function setup(options?: {
		addManifest?: boolean,
		addResFolder?: boolean,
		addAssetsFolder?: boolean,
		addLegacyIncludeGradle?: boolean,
		addProjectDir?: boolean,
		addProjectRuntime?: boolean,
		latestRuntimeGradleVersion?: string,
		latestRuntimeGradleAndroidVersion?: string,
		projectRuntimeGradleVersion?: string,
		projectRuntimeGradleAndroidVersion?: string,
	}): IBuildOptions {
		options = options || {};
		spawnFromEventCalled = false;
		tempFolder = temp.mkdirSync("androidPluginBuildService-temp");
		pluginFolder = temp.mkdirSync("androidPluginBuildService-plugin");
		setupDI(options);
		setupPluginFolders(options.addManifest, options.addResFolder, options.addAssetsFolder, options.addLegacyIncludeGradle);

		return {
			platformsAndroidDirPath: pluginFolder,
			pluginName: pluginName,
			aarOutputDir: pluginFolder,
			tempPluginDirPath: tempFolder,
			projectDir: options.addProjectDir ? pluginFolder : null
		};
	}

	function setupDI(options: {
		addProjectRuntime?: boolean
		latestRuntimeGradleVersion?: string,
		latestRuntimeGradleAndroidVersion?: string,
		projectRuntimeGradleVersion?: string,
		projectRuntimeGradleAndroidVersion?: string,
	}): void {
		const testInjector: IInjector = new Yok();
		testInjector.register("fs", FsLib.FileSystem);
		testInjector.register("childProcess", {
			spawnFromEvent: async (command: string): Promise<ISpawnResult> => {
				const finalAarName = `${shortPluginName}-release.aar`;
				const aar = path.join(tempFolder, shortPluginName, "build", "outputs", "aar", finalAarName);
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
				return options.addProjectRuntime ? "1.0.0" : null;
			}
		});
		testInjector.register('devicePlatformsConstants', DevicePlatformsConstants);
		testInjector.register('npm', setupNpm(options));

		fs = testInjector.resolve("fs");
		androidBuildPluginService = testInjector.resolve<AndroidPluginBuildService>(AndroidPluginBuildService);
	}

	function setupNpm(options: {
		latestRuntimeGradleVersion?: string,
		latestRuntimeGradleAndroidVersion?: string,
		projectRuntimeGradleVersion?: string,
		projectRuntimeGradleAndroidVersion?: string,
		addProjectRuntime?: boolean
	}): any {
		return {
			getRegistryPackageData: async (packageName: string): Promise<any> => {
				const result: any = [];
				result["dist-tags"] = { latest: '4.1.2' };
				result.versions = [];
				result.versions['1.0.0'] = {
					"name": packageName,
					"gradle": {
						"version": options.projectRuntimeGradleVersion,
						"android": options.projectRuntimeGradleAndroidVersion
					}
				};
				result.versions['4.1.2'] = {
					"name": packageName,
					"gradle": {
						"version": options.latestRuntimeGradleVersion,
						"android": options.latestRuntimeGradleAndroidVersion
					}
				};

				return result;
			}
		};
	}

	function setUpIncludeGradle() {
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

	function setupPluginFolders(manifestFile: boolean, resFolder: boolean, assetsFolder: boolean, addLegacyIncludeGradle: boolean) {
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
			fs.writeFile(path.join(pluginFolder, "AndroidManifest.xml"), validAndroidManifestContent);
		}

		if (resFolder) {
			const valuesFolder = path.join(pluginFolder, "res", "values");
			fs.createDirectory(valuesFolder);
			fs.writeFile(path.join(valuesFolder, "strings.xml"), validStringsXmlContent);
		}

		if (assetsFolder) {
			const imagesFolder = path.join(pluginFolder, "assets", "images");
			fs.createDirectory(imagesFolder);
			fs.writeFile(path.join(imagesFolder, "myicon.png"), "123");
		}

		if (addLegacyIncludeGradle) {
			setUpIncludeGradle();
		}
	}

	describe('buildAar', () => {

		it('builds aar when all supported files are in the plugin', async () => {
			const config: IBuildOptions = setup({
				addManifest: true,
				addResFolder: true,
				addAssetsFolder: true
			});

			await androidBuildPluginService.buildAar(config);

			assert.isTrue(spawnFromEventCalled);
		});

		it('does not build aar when there are no supported files in the plugin', async () => {
			const config: IBuildOptions = setup();

			await androidBuildPluginService.buildAar(config);

			assert.isFalse(spawnFromEventCalled);
		});

		it('builds aar when there are res and assets folders', async () => {
			const config: IBuildOptions = setup({
				addResFolder: true,
				addAssetsFolder: true
			});

			await androidBuildPluginService.buildAar(config);

			assert.isTrue(spawnFromEventCalled);
		});

		it('builds aar when there is an android manifest', async () => {
			const config: IBuildOptions = setup({
				addManifest: true
			});

			await androidBuildPluginService.buildAar(config);

			assert.isTrue(spawnFromEventCalled);
		});

		it('builds aar with the latest runtime gradle versions when no project dir is specified', async () => {
			const expectedGradleVersion = "1.2.3";
			const expectedAndroidVersion = "4.5.6";
			const config: IBuildOptions = setup({
				addManifest: true,
				latestRuntimeGradleVersion: expectedGradleVersion,
				latestRuntimeGradleAndroidVersion: expectedAndroidVersion
			});

			await androidBuildPluginService.buildAar(config);
			const actualAndroidVersion = getGradleAndroidPluginVersion();
			const actualGradleVersion = getGradleVersion();

			assert.equal(actualAndroidVersion, expectedAndroidVersion);
			assert.equal(actualGradleVersion, expectedGradleVersion);
			assert.isTrue(spawnFromEventCalled);
		});

		it('builds aar with the latest runtime gradle versions when a project dir without runtime versions is specified', async () => {
			const expectedGradleVersion = "4.4.4";
			const expectedAndroidVersion = "5.5.5";
			const config: IBuildOptions = setup({
				addManifest: true,
				addProjectDir: true,
				latestRuntimeGradleVersion: expectedGradleVersion,
				latestRuntimeGradleAndroidVersion: expectedAndroidVersion,
				addProjectRuntime: true,
				projectRuntimeGradleVersion: null,
				projectRuntimeGradleAndroidVersion: null
			});

			await androidBuildPluginService.buildAar(config);
			const actualAndroidVersion = getGradleAndroidPluginVersion();
			const actualGradleVersion = getGradleVersion();

			assert.equal(actualGradleVersion, expectedGradleVersion);
			assert.equal(actualAndroidVersion, expectedAndroidVersion);
			assert.isTrue(spawnFromEventCalled);
		});

		it('builds aar with the specified runtime gradle versions when project runtime has gradle versions', async () => {
			const expectedGradleVersion = "2.2.2";
			const expectedAndroidVersion = "3.3";
			const config: IBuildOptions = setup({
				addManifest: true,
				addProjectDir: true,
				latestRuntimeGradleVersion: "4.4.4",
				latestRuntimeGradleAndroidVersion: "5.5.5",
				addProjectRuntime: true,
				projectRuntimeGradleVersion: expectedGradleVersion,
				projectRuntimeGradleAndroidVersion: expectedAndroidVersion
			});

			await androidBuildPluginService.buildAar(config);
			const actualAndroidVersion = getGradleAndroidPluginVersion();
			const actualGradleVersion = getGradleVersion();

			assert.equal(actualGradleVersion, expectedGradleVersion);
			assert.equal(actualAndroidVersion, expectedAndroidVersion);
			assert.isTrue(spawnFromEventCalled);
		});

		it('builds aar with a hardcoded runtime gradle versions when a project runtime and the latest runtime do not have versions specified', async () => {
			const expectedGradleVersion = "4.4";
			const expectedAndroidVersion = "3.1.2";
			const config: IBuildOptions = setup({
				addManifest: true,
				addProjectDir: true,
				latestRuntimeGradleVersion: null,
				latestRuntimeGradleAndroidVersion: null,
				addProjectRuntime: true,
				projectRuntimeGradleVersion: null,
				projectRuntimeGradleAndroidVersion: null
			});

			await androidBuildPluginService.buildAar(config);
			const actualAndroidVersion = getGradleAndroidPluginVersion();
			const actualGradleVersion = getGradleVersion();

			assert.equal(actualGradleVersion, expectedGradleVersion);
			assert.equal(actualAndroidVersion, expectedAndroidVersion);
			assert.isTrue(spawnFromEventCalled);
		});
	});

	describe('migrateIncludeGradle', () => {
		it('if there is a legacy include.gradle file', async () => {
			const config: IBuildOptions = setup({
				addLegacyIncludeGradle: true
			});

			await androidBuildPluginService.migrateIncludeGradle(config);

			const includeGradleContent = fs.readText(path.join(pluginFolder, INCLUDE_GRADLE_NAME).toString());
			const areProductFlavorsRemoved = includeGradleContent.indexOf("productFlavors") === -1;
			assert.isTrue(areProductFlavorsRemoved);
		});
	});

	function getGradleAndroidPluginVersion() {
		const gradleWrappersContent = fs.readText(path.join(tempFolder, shortPluginName, "build.gradle"));
		const androidVersionRegex = /com\.android\.tools\.build\:gradle\:(.*)\'\n/g;
		const androidVersion = androidVersionRegex.exec(gradleWrappersContent)[1];

		return androidVersion;
	}

	function getGradleVersion() {
		const buildGradleContent = fs.readText(path.join(tempFolder, shortPluginName, "gradle", "wrapper", "gradle-wrapper.properties"));
		const gradleVersionRegex = /gradle\-(.*)\-bin\.zip\n/g;
		const gradleVersion = gradleVersionRegex.exec(buildGradleContent)[1];

		return gradleVersion;
	}
});
