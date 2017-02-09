declare module NativeScriptDoctor {
	/**
	 * Describes methods which helps collecting system information.
	 */
	interface ISysInfo {
		/**
		 * Returns the currently installed Java version.
		 * @return {Promise<string>} The currently installed Java version.
		 */
		getJavaVersion(): Promise<string>;

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
		 * Returns the currently installed node-gyp version.
		 * @return {Promise<string>} Returns the currently installed node-gyp version. If node-gyp is not installed it will return null.
		 */
		getNodeGypVersion(): Promise<string>;

		/**
		 * Returns the xcodeproj gem location.
		 * @return {Promise<string>} Returns the xcodeproj gem location. If the the xcodeproj gem is not installed it will return null.
		 */
		getXcodeprojGemLocation(): Promise<string>;

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
		 * @return {Promise<string>} Returns the currently installed ADB version. It will return null if ADB is not installed.
		 */
		getAdbVersion(): Promise<string>;

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
		 * Returns the whole system information.
		 * @return {Promise<ISysInfoData>} The system information.
		 */
		getSysInfo(): Promise<ISysInfoData>;
	}

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
		 * node.js version, returned by `process.version`.
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
		 * Version of java, as returned by `java -version`.
		 * @type {string}
		 */
		javaVer: string;

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
		xcodeprojGemLocation: string;

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
	}

	/**
	 * Describes warning returned from nativescript-doctor check.
	 */
	interface IWarning {
		/** The warning. */
		warning: string;
		/** Additional information for the warning. */
		additionalInformation: string;
	}
}
