declare module NativeScriptDoctor {
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
		 * Returns the currently installed Java version.
		 * @return {Promise<string>} The currently installed Java version.
		 */
		getJavaVersion(): Promise<string>;

		/**
		 * Returns the currently installed Java path based on JAVA_HOME and PATH..
		 * @return {Promise<string>} The currently installed Java path.
		 */
		getJavaPath(): Promise<string>;

		/**
		 * Gets JAVA version based on the executable in PATH.
		 * @return {Promise<string>}
		 */
		getJavaVersionFromPath(): Promise<string>;

		/**
		 * Gets JAVA version based on the JAVA from JAVA_HOME.
		 * @return {Promise<string>}
		 */
		getJavaVersionFromJavaHome(): Promise<string>;

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
		 * Returns the currently installed Npm version.
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
		 * Returns the path to the currently installed Git.
		 * @return {Promise<string>} Returns the path to the currently installed Git. It will return null if Git is not installed.
		 */
		getGitPath(): Promise<string>;

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
		 * @return {Promise<boolean>} true if an update us require.
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
	}

	interface ISysInfoConfig {
		/**
		 * The platform for which to check if environment is properly configured.
		 */
		platform?: string;
		/**
		 * Path to package.json file of NativeScript CLI
		 * @type {string}
		 */
		pathToNativeScriptCliPackageJson?: string;
		/**
		 * Android tools data
		 * @type {{pathToAdb: string}}
		 */
		androidToolsInfo?: {
			/**
			 * Path to adb
			 * @type {string}
			 */
			pathToAdb: string;
		};

		/**
		 * The project directory. Used to determine the Android Runtime version and validate the Java compiler version against it.
		 * If it is not passed or the project does not have Android runtime, this validation is skipped.
		 */
		projectDir?: string;

		/**
		 * The runtime version against which the validation is executed. In case this parameter is passed, it takes precedence over the projectDir argument.
		 */
		androidRuntimeVersion?: string;
	}

	/**
	 * Describes methods which help identifying if the environment can be used for development of {N} apps.
	 */
	interface IDoctor {
		/**
		 * Checks if a local build can be executed on the current machine.
		 * @param {string} platform The platform for which to check if local build is possible.
		 * @param {string} projectDir @optional The project directory. Used to determine the Android Runtime version and validate the Java compiler version against it.
		 * If it is not passed or the project does not have Android runtime, this validation is skipped.
		 * @param {string} runtimeVersion @optional The runtime version against which the validation is executed. In case this parameter is passed, it takes precedence over the projectDir argument.
		 * @return {Promise<boolean>} true if local build can be executed for the provided platform.
		 */
		canExecuteLocalBuild(platform: string, projectDir?: string, runtimeVersion?: string): Promise<boolean>;

		/**
		 * Executes all checks for the current environment and returns the warnings from each check.
		 * @return {Promise<IWarning[]>} Array of all the warnings from all checks. If there are no warnings will return empty array.
		 */
		getWarnings(): Promise<IWarning[]>;

		/**
		 * Executes all checks for the current environment and returns the info from each check
		 * @param {NativeScriptDoctor.ISysInfoConfig}
		 * @return {Promise<IInfo[]>} Array of all the infos from all checks.
		 */
		getInfos(config?: NativeScriptDoctor.ISysInfoConfig): Promise<IInfo[]>;
	}

	interface ICommonSysInfoData {
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
		 * The command shell in use, usually bash or cmd.
		 * @type {string}
		 */
		shell: string;
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
		/**
		 * git version string, as returned by `git --version`.
		 * @type {string}
		 */
		gitVer: string;
		/**
		 * NativeScript CLI version string, as returned by `tns --version`.
		 * @type {string}
		 */
		nativeScriptCliVersion: string;
	}

	interface IiOSSysInfoData {
		/**
		 * Xcode version string as returned by `xcodebuild -version`. Valid only on Mac.
		 * @type {string}
		 */
		xcodeVer: string;
		/**
		 * Whether iTunes is installed on the machine.
		 * @type {boolean}
		 */
		itunesInstalled: boolean;
		/**
		 * pod version string, as returned by `pod --version`.
		 * @type {string}
		 */
		cocoaPodsVer: string;
		/**
		 * xcodeproj location, as returned by `which xcodeproj`.
		 * @type {string}
		 */
		xcodeprojLocation: string;
		/**
		 * true id CocoaPods can successfully execute pod install.
		 * @type {boolean}
		 */
		isCocoaPodsWorkingCorrectly: boolean;
		/**
		 * Information about xcproj.
		 * @type {string}
		 */
		xcprojInfo: IXcprojInfo;
		/**
		 * true if the system requires xcproj to build projects successfully and the CocoaPods version is not compatible with the Xcode.
		 * @type {boolean}
		 */
		isCocoaPodsUpdateRequired: boolean;
		/**
		 * Information about python installation
		 */
		pythonInfo: IPythonInfo;
	}

	interface IAndroidSysInfoData {
		/**
		 * Version string of adb, as returned by `adb version`.
		 * @type {string}
		 */
		adbVer: string;
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
		 * java version string as returned by `java -version`.
		 * @type {string}
		 */
		javaVersion: string;
		/**
		 * java path based on JAVA_HOME and PATH.
		 * @type {string}
		 */
		javaPath: string;
		/**
		 * true if the Android SDK Tools are installed and configured correctly.
		 * @type {boolean}
		 */
		isAndroidSdkConfiguredCorrectly: boolean;
		/**
		 * .net version, applicable to windows only.
		 * @type {string}
		 */
		dotNetVer?: string;
	}

	interface ISysInfoData extends ICommonSysInfoData, IiOSSysInfoData, IAndroidSysInfoData { }

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

	interface IInfo {
		/**
		 * The message.
		 * @type {string}
		 */
		message: string;

		/**
		 * Additional information for the warning.
		 * @type {string}
		 */
		additionalInformation?: string;

		/**
		 * The platforms which are affected by this warning.
		 * @type {string[]}
		 */
		platforms: string[];

		/**
		 * The warning.
		 * @type {string} // can be warning, note or info
		 */
		type: string;
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

	/**
	 * Describes information about python
	 */
	interface IPythonInfo {
		/**
		 * Determines whether python is installed on the host machine
		 */
		isInstalled: boolean;

		/**
		 * Determines whether python six package is installed
		 */
		isSixPackageInstalled: boolean;

		/**
		 * Error message from installation check
		 */
		installationErrorMessage?: string;
	}

	/**
	 * Describes the constants used in the module.
	 */
	interface IConstants {
		ANDROID_PLATFORM_NAME: string;
		IOS_PLATFORM_NAME: string;
		SUPPORTED_PLATFORMS: string[];
		INFO_TYPE_NAME: string;
		WARNING_TYPE_NAME: string;
	}

	/**
	 * Describes methods for getting and validating Android tools.
	 */
	interface IAndroidToolsInfo {
		ANDROID_TARGET_PREFIX: string;
		androidHome: string;

		/**
		 * Returns the Android tools info.
		 * @return {NativeScriptDoctor.IAndroidToolsInfoData} returns the Android tools info.
		 */
		getToolsInfo(config: IProjectDir): NativeScriptDoctor.IAndroidToolsInfoData;

		/**
		 * Checks if the Android tools are valid.
		 * @return {NativeScriptDoctor.IWarning[]} An array of errors from the validation checks. If there are no errors will return [].
		 */
		validateInfo(config: IProjectDir): NativeScriptDoctor.IWarning[];

		/**
		 * Checks if the current javac version is valid.
		 * @param {string} installedJavaVersion The version of javac to check.
		 * @param {string} projectDir @optional The project directory. Used to determine the Android Runtime version and validate the Java compiler version against it.
		 * If it is not passed or the project does not have Android runtime, this validation is skipped.
		 * @param {string} runtimeVersion @optional The runtime version against which the validation is executed. In case this parameter is passed, it takes precedence over the projectDir argument.
		 * @return {NativeScriptDoctor.IWarning[]} An array of errors from the validation checks. If there are no errors will return [].
		 */
		validateJavacVersion(installedJavaVersion: string, projectDir?: string, runtimeVersion?: string): NativeScriptDoctor.IWarning[];

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
		 * Validates if the provided targetSdk is greater that the minimum supported target SDK.
		 * @param {ITargetValidationOptions} options The targetSdk to be validated and the project directory - used to determine the Android Runtime version.
		 * @return {NativeScriptDoctor.IWarning[]} An array of errors from the validation checks. If there are no errors will return [].
		 */
		validateMinSupportedTargetSdk(options: ITargetValidationOptions): NativeScriptDoctor.IWarning[];

		/**
		 * Validates if the provided targetSdk is lower that the maximum supported target SDK.
		 * @param {ITargetValidationOptions} options The targetSdk to be validated and the project directory - used to determine the Android Runtime version.
		 * @return {NativeScriptDoctor.IWarning[]} An array of errors from the validation checks. If there are no errors will return [].
		 */
		validataMaxSupportedTargetSdk(options: ITargetValidationOptions): NativeScriptDoctor.IWarning[];

		/**
		 * Returns the path to the emulator executable.
		 * @return {string} The path to the emulator executable.
		 */
		getPathToEmulatorExecutable(): string;
	}

	/**
	 * The targetSdk to be validated.
	 */
	interface ITargetValidationOptions extends Partial<IProjectDir> {
		targetSdk: number;
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
		 * A list of the installed Android SDKs.
		 */
		installedTargets: string[];
	}

	/**
	 * Object with a single property - projectDir. This is the root directory where NativeScript project is located.
	 */
	interface IProjectDir {
		projectDir: string;
	}
}
