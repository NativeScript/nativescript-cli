declare module NativeScriptDoctor {
	export const doctor: IDoctor;
	export const sysInfo: ISysInfo;

	export interface ISysInfo {
		getJavaVersion(): Promise<string>;

		getJavaCompilerVersion(): Promise<string>;

		getXCodeVersion(): Promise<string>;

		getNodeVersion(): Promise<string>;

		getNodeGypVersion(): Promise<string>;

		getXCodeProjGemLocation(): Promise<string>;

		isITunesInstalled(): Promise<boolean>;

		getCocoapodVersion(): Promise<string>;

		getOs(): Promise<string>;

		getAdbVersion(): Promise<string>;

		isAndroidInstalled(): Promise<boolean>;

		getMonoVersion(): Promise<string>;

		getGitVersion(): Promise<string>;

		getGradleVersion(): Promise<string>;

		getSysInfo(): Promise<ISysInfoData>;

		isCocoaPodsWorkingCorrectly(): Promise<boolean>
	}

	export interface IDoctor {
		canExecuteLocalBuild(platform: string): Promise<boolean>;
		getWarnings(): Promise<IWarning[]>;
	}

	export interface ISysInfoData {
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
		cocoapodVer: string;

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
	}

	/**
	 * Describes warning returned from nativescript-doctor check.
	 */
	export interface IWarning {
		/** The warning. */
		warning: string;
		/** Additional information for the warning. */
		additionalInformation: string;
	}
}

export = NativeScriptDoctor;
