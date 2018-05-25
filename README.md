# nativescript-doctor
Library that helps identifying if the environment can be used for development of {N} apps.

# Installation
1. Using npm
	```bash
	$ npm install nativescript-doctor --save
	```

# Requirements
1. Node.js 4.3.0 or later

# Usage
* Module `doctor`:
	- Usage:
	```TypeScript
	import { doctor } from "nativescript-doctor"

	async function main() {
		const canExecuteLocalBuildForAndroid = await doctor.canExecuteLocalBuild("Android");
		const canExecuteLocalBuildForIos = await doctor.canExecuteLocalBuild("iOS");
		console.log("Can execute local build for Android: ", canExecuteLocalBuildForAndroid);
		console.log("Can execute local build for iOS: ", canExecuteLocalBuildForIos);
	}

	main();
	```

	- Interfaces:
	```TypeScript
	/**
	 * Describes methods which help identifying if the environment can be used for development of {N} apps.
	 */
	interface IDoctor {
		/**
		 * Checks if a local build can be executed on the current machine.
		 * @param {string} platform The platform for which to check if local build is possible.
		 * @return {Promise<boolean>} true if local build can be executed for the provided platform.
		 */
		canExecuteLocalBuild(platform: string): Promise<boolean>;

		/**
		 * Executes all checks for the current environment and returns the warnings from each check.
		 * @return {Promise<IWarning[]>} Array of all the warnings from all checks. If there are no warnings will return empty array.
		 */
		getWarnings(): Promise<IWarning[]>;
	}

	/**
	 * Describes warning returned from nativescript-doctor check.
	 */
	interface IWarning {
		/**
		 * The warning.
		 * @type {string}
		 */
		warning: string;

		/**
		 * Additional information for the warning.
		 * @type {string}
		 */
		additionalInformation: string;

		/**
		 * The platforms which are affected by this warning.
		 * @type {string[]}
		 */
		platforms: string[];
	}
	```

* Module `sysInfo`:
	- Usage:
	```TypeScript
	import { sysInfo, setShouldCacheSysInfo } from "nativescript-doctor";

	async function main() {
		// The default value is true. If set to false the result of each check for each element
		// of the sys info will not be cached.
		setShouldCacheSysInfo(false);

		const javacVersion = await sysInfo.getJavaCompilerVersion();
		console.log("javac: ", javacVersion);

		const adbVersion = await sysInfo.getAdbVersion();
		console.log("adb: ", adbVersion);

		const cocoaPodsVersion = await sysInfo.getCocoaPodsVersion();
		console.log("cocoapods: ", cocoaPodsVersion);

		const gitVersion = await sysInfo.getGitVersion();
		console.log("git: ", gitVersion);

		const gradleVersion = await sysInfo.getGradleVersion();
		console.log("gradle: ", gradleVersion);

		const monoVersion = await sysInfo.getMonoVersion();
		console.log("mono: ", monoVersion);

		const nodeVersion = await sysInfo.getNodeVersion();
		console.log("node: ", nodeVersion);

		const npmVersion = await sysInfo.getNpmVersion();
		console.log("npm: ", npmVersion);

		const nodeGypVersion = await sysInfo.getNodeGypVersion();
		console.log("node-gyp: ", nodeGypVersion);

		const osName = await sysInfo.getOs();
		console.log("os: ", osName);

		const xcodeprojLocation = await sysInfo.getXCodeProjLocation();
		console.log("xcodeproj location: ", xcodeprojLocation);

		const xcodeVersion = await sysInfo.getXCodeVersion();
		console.log("xcode: ", xcodeVersion);

		const isAndroidInstalled = await sysInfo.isAndroidInstalled();
		console.log("is Android installed: ", isAndroidInstalled);

		const isITunesInstalled = await sysInfo.isITunesInstalled();
		console.log("is iTunes installed: ", isITunesInstalled);

		const isCocoaPodsWorkingCorrectly = await sysInfo.isCocoaPodsWorkingCorrectly();
		console.log("is cocoapods working correctly: ", isCocoaPodsWorkingCorrectly);

		const nativeScriptCliVersion = await sysInfo.getNativeScriptCliVersion();
		console.log("{N} CLI version: ", nativeScriptCliVersion);

		const xcprojInfo = await sysInfo.getXcprojInfo();
		console.log("xcproj info: ", xcprojInfo);

		const isCocoaPodsUpdateRequired = await sysInfo.isCocoaPodsUpdateRequired();
		console.log("is CocoaPods update required: ", isCocoaPodsUpdateRequired);

		const pythonInfo = await sysInfo.getPythonInfo();
		console.log("python info: ", pythonInfo );

		const sysInfoData = await sysInfo.getSysInfo({ projectDir: "/Users/username/myProject" });
		console.log("sysInfo: ", sysInfoData);

		const gitPath = await sysInfo.getGitPath();
		console.log("Path to the git executable: ", gitPath);
	}

	main();

	```

	- Interfaces:
	```TypeScript
	/**
	 * Describes methods which helps collecting system information.
	 */
	interface ISysInfo {
		/**
		 * Returns the currently installed Java compiler version.
		 * @return {Promise<string>} The currently installed Java compiler version.
		 */
		getJavaCompilerVersion(): Promise<string>;

		/**
		 * Returns the currently installed version of Xcode.
		 * @return {Promise<string>} Returns the currently installed version of Xcode or null if Xcode is not installed or executed on Linux or Windows.
		 */
		getXcodeVersion(): Promise<string>;

		/**
		 * Returns the currently installed Node.js version.
		 * @return {Promise<string>} Returns the currently installed Node.js version.
		 */
		getNodeVersion(): Promise<string>;

		/**
		 * Returns the currently installed npm version.
		 * @return {Promise<string>} Returns the currently installed npm version.
		 */
		getNpmVersion(): Promise<string>;

		/**
		 * Returns the currently installed node-gyp version.
		 * @return {Promise<string>} Returns the currently installed node-gyp version. If node-gyp is not installed it will return null.
		 */
		getNodeGypVersion(): Promise<string>;

		/**
		 * Returns the xcodeproj location.
		 * @return {Promise<string>} Returns the xcodeproj location. If the the xcodeproj is not installed it will return null.
		 */
		getXcodeprojLocation(): Promise<string>;

		/**
		 * Checks if iTunes is installed.
		 * @return {Promise<string>} Returns true if iTunes is installed.
		 */
		isITunesInstalled(): Promise<boolean>;

		/**
		 * Returns the currently installed Cocoapods version.
		 * @return {Promise<string>} Returns the currently installed Cocoapods version. It will return null if Cocoapods is not installed.
		 */
		getCocoaPodsVersion(): Promise<string>;

		/**
		 * Returns the os name.
		 * @return {Promise<string>} Returns the os name.
		 */
		getOs(): Promise<string>;

		/**
		 * Returns the currently installed ADB version.
		 * @param {string} pathToAdb Defines path to adb
		 * @return {Promise<string>} Returns the currently installed ADB version. It will return null if ADB is not installed.
		 */
		getAdbVersion(pathToAdb?: string): Promise<string>;

		/**
		 * Checks if Android is installed.
		 * @return {Promise<boolean>} Returns true if Android is installed.
		 */
		isAndroidInstalled(): Promise<boolean>;

		/**
		 * Returns the currently installed Mono version.
		 * @return {Promise<string>} Returns the currently installed Mono version. It will return null if Mono is not installed.
		 */
		getMonoVersion(): Promise<string>;

		/**
		 * Returns the currently installed Git version.
		 * @return {Promise<string>} Returns the currently installed Git version. It will return null if Git is not installed.
		 */
		getGitVersion(): Promise<string>;

		/**
		 * Returns the currently installed Gradle version.
		 * @return {Promise<string>} Returns the currently installed Gradle version. It will return null if Gradle is not installed.
		 */
		getGradleVersion(): Promise<string>;

		/**
		 * Checks if CocoaPods is working correctly by trying to install one pod.
		 * @return {Promise<boolean>} Returns true if CocoaPods is working correctly.
		 */
		isCocoaPodsWorkingCorrectly(): Promise<boolean>;

		/**
		 * Returns the version of the globally installed NativeScript CLI.
		 * @return {Promise<string>} Returns the version of the globally installed NativeScript CLI.
		 */
		getNativeScriptCliVersion(): Promise<string>;

		/**
		 * Checks if xcproj is required to build projects and if it is installed.
		 * @return {Promise<IXcprojInfo>} Returns the collected information aboud xcproj.
		 */
		getXcprojInfo(): Promise<IXcprojInfo>;

		/**
		 * Checks if the current version of CocoaPods is compatible with the installed Xcode.
		 * @return {boolean} true if an update us require.
		 */
		isCocoaPodsUpdateRequired(): Promise<boolean>;

		/**
		 * Checks if the Android SDK Tools are installed and configured correctly.
		 * @return {Promise<boolean>} true if the Android SDK Tools are installed and configured correctly.
		 */
		isAndroidSdkConfiguredCorrectly(): Promise<boolean>;

		/**
		 * Returns the whole system information.
		 * @param {ISysInfoConfig} config
		 * @return {Promise<ISysInfoData>} The system information.
		 */
		getSysInfo(config?: ISysInfoConfig): Promise<ISysInfoData>;

		/**
		 * If set to true each method will cache it's result. The default value is true.
		 * @param {boolean} shouldCache The cache switch.
		 * @return {void}
		 */
		setShouldCacheSysInfo(shouldCache: boolean): void;

		/**
		 * Returns the path to the currently installed Git.
		 * @return {Promise<string>} Returns the path to the currently installed Git. It will return null if Git is not installed.
		 */
		getGitPath(): Promise<string>;
	}

	interface ISysInfoData {
		// os stuff
		/**
		 * Os platform flavour, reported by os.platform.
		 * @type {string}
		 */
		platform: string;

		/**
		 * Full os name, like `uname -a` on unix, registry query on win.
		 * @type {string}
		 */
		os: string;

		/**
		 * .net version, applicable to windows only.
		 * @type {string}
		 */
		dotNetVer: string;

		/**
		 * The command shell in use, usually bash or cmd.
		 * @type {string}
		 */
		shell: string;

		// node stuff
		/**
		 * node.js version, returned by node -v.
		 * @type {string}
		 */
		nodeVer: string;

		/**
		 * npm version, returned by `npm -v`.
		 * @type {string}
		 */
		npmVer: string;

		/**
		 * Process architecture, returned by `process.arch`.
		 * @type {string}
		 */
		procArch: string;

		/**
		 * node-gyp version as returned by `node-gyp -v`.
		 * @type {string}
		 */
		nodeGypVer: string;

		// dependencies
		/**
		 * Xcode version string as returned by `xcodebuild -version`. Valid only on Mac.
		 * @type {string}
		 */
		xcodeVer: string;

		/**
		 * Version string of adb, as returned by `adb version`.
		 * @type {string}
		 */
		adbVer: string;

		/**
		 * Whether iTunes is installed on the machine.
		 * @type {boolean}
		 */
		itunesInstalled: boolean;

		/**
		 * Whether `android` executable can be run.
		 * @type {boolean}
		 */
		androidInstalled: boolean;

		/**
		 * mono version, relevant on Mac only.
		 * @type {string}
		 */
		monoVer: string;

		/**
		 * git version string, as returned by `git --version`.
		 * @type {string}
		 */
		gitVer: string;

		/**
		 * gradle version string as returned by `gradle -v`.
		 * @type {string}
		 */
		gradleVer: string;

		/**
		 * javac version string as returned by `javac -version`.
		 * @type {string}
		 */
		javacVersion: string;

		/**
		 * pod version string, as returned by `pod --version`.
		 * @type {string}
		 */
		cocoaPodsVer: string;

		/**
		 * xcodeproj gem location, as returned by `which gem xcodeproj`.
		 * @type {string}
		 */
		xcodeprojLocation: string;

		/**
		 * true id CocoaPods can successfully execute pod install.
		 * @type {boolean}
		 */
		isCocoaPodsWorkingCorrectly: boolean;

		/**
		 * NativeScript CLI version string, as returned by `tns --version`.
		 * @type {string}
		 */
		nativeScriptCliVersion: string;

		/**
		 * Information about xcproj.
		 * @type {string}
		 */
		xcprojInfo: IXcprojInfo;

		/**
		 * true if the system requires xcproj to build projects successfully and the CocoaPods version is not compatible with the Xcode.
		 */
		isCocoaPodsUpdateRequired: boolean;

		/**
		 * true if the Android SDK Tools are installed and configured correctly.
		 * @type {boolean}
		 */
		isAndroidSdkConfiguredCorrectly: boolean;
	}

	/**
	 * Describes information about xcproj brew formula.
	 */
	interface IXcprojInfo {
		/**
		 * Determines whether the system needs xcproj to execute ios builds sucessfully.
		 */
		shouldUseXcproj: boolean;

		/**
		 * Determines whether xcproj can be called from the command line.
		 */
		xcprojAvailable: boolean;
	}
	```

* Module `androidToolsInfo`:
	- Usage:
	```TypeScript
	import { androidToolsInfo } from "nativescript-doctor"

	function main() {
		const projectDir = "/Users/username/myProject";
		console.log("path to adb from android home: ", await androidToolsInfo.getPathToAdbFromAndroidHome());
		console.log("path to emulator executable: ", androidToolsInfo.getPathToEmulatorExecutable());
		console.log("android tools info: ", androidToolsInfo.getToolsInfo());
		console.log("ANROID_HOME validation errors: ", await androidToolsInfo.validateAndroidHomeEnvVariable());
		console.log("android tools info validation errors: ", await androidToolsInfo.validateInfo());
		console.log("javac validation errors: ", await androidToolsInfo.validateJavacVersion(await sysInfo.getJavaCompilerVersion(), projectDir));
	}

	main();
	```
	- Interfaces:
	```TypeScript
	/**
	 * Describes methods for getting and validating Android tools.
	 */
	interface IAndroidToolsInfo {
		/**
		 * Returns the Android tools info.
		 * @return {NativeScriptDoctor.IAndroidToolsInfoData} returns the Android tools info.
		 */
		getToolsInfo(): NativeScriptDoctor.IAndroidToolsInfoData;

		/**
		 * Checks if the Android tools are valid.
		 * @param {string} projectDir @optional The project directory. Used to determine the Android Runtime version and validate the Java compiler version against it.
		 * If it is not passed or the project does not have Android runtime, this validation is skipped.
		 * @return {NativeScriptDoctor.IWarning[]} An array of errors from the validation checks. If there are no errors will return [].
		 */
		validateInfo(projectDir?: string): NativeScriptDoctor.IWarning[];

		/**
		 * Checks if the current javac version is valid.
		 * @param {string} installedJavaVersion The version of javac to check.
		 * @param {string} projectDir @optional The project directory. Used to determine the Android Runtime version and validate the Java compiler version against it.
		 * If it is not passed or the project does not have Android runtime, this validation is skipped.
		 * @return {NativeScriptDoctor.IWarning[]} An array of errors from the validation checks. If there are no errors will return [].
		 */
		validateJavacVersion(installedJavaVersion: string, projectDir?: string): NativeScriptDoctor.IWarning[];

		/**
		 * Returns the path to the adb which is located in ANDROID_HOME.
		 * @return {Promise<string>} Path to the adb which is located in ANDROID_HOME.
		 */
		getPathToAdbFromAndroidHome(): Promise<string>;

		/**
		 * Checks if the ANDROID_HOME variable is set to the correct folder.
		 * @return {NativeScriptDoctor.IWarning[]} An array of errors from the validation checks. If there are no errors will return [].
		 */
		validateAndroidHomeEnvVariable(): NativeScriptDoctor.IWarning[];

		/**
		 * Returns the path to the emulator executable.
		 * @return {string} The path to the emulator executable.
		 */
		getPathToEmulatorExecutable(): string;
	}

	/**
	 * Describes information about installed Android tools and SDKs.
	 */
	interface IAndroidToolsInfoData {
		/**
		 * The value of ANDROID_HOME environment variable.
		 */
		androidHomeEnvVar: string;

		/**
		 * The latest installed version of Android Build Tools that satisfies CLI's requirements.
		 */
		buildToolsVersion: string;

		/**
		 * The latest installed version of Android SDK that satisfies CLI's requirements.
		 */
		compileSdkVersion: number;

		/**
		 * The latest installed version of Android Support Repository that satisfies CLI's requirements.
		 */
		supportRepositoryVersion: string;
	}
	```

* Module `constants`:
	- Usage:
	```TypeScript
	import { constants } from "nativescript-doctor"

	function main() {
		for(let constantName in constants) {
			console.log(`${constantName}: ${constants[constantName]}`);
		}
	}

	main();
	```

	- Interfaces:
	```TypeScript
	/**
	 * Describes the constants used in the module.
	 */
	interface IConstants {
		ANDROID_PLATFORM_NAME: string;
		IOS_PLATFORM_NAME: string;
		SUPPORTED_PLATFORMS: string[];
	}
	```
