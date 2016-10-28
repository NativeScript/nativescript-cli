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
		/** os platform flavour, reported by os.platform */
		platform: string;
		/** Full os name, like `uname -a` on unix, registry query on win */
		os: string;
		/** .net version, applicable to windows only */
		dotNetVer: string;
		/** The command shell in use, usually bash or cmd */
		shell: string;

		// node stuff
		/** node.js version, returned by `process.version` */
		nodeVer: string;
		/** npm version, returned by `npm -v` */
		npmVer: string;
		/** Process architecture, returned by `process.arch` */
		procArch: string;
		/** node-gyp version as returned by `node-gyp -v`*/
		nodeGypVer: string;

		// dependencies
		/** version of java, as returned by `java -version` */
		javaVer: string;
		/** Xcode version string as returned by `xcodebuild -version`. Valid only on Mac */
		xcodeVer: string;
		/** Version string of adb, as returned by `adb version` */
		adbVer: string;
		/** Whether iTunes is installed on the machine */
		itunesInstalled: boolean;
		/** Whether `android` executable can be run */
		androidInstalled: boolean;
		/** mono version, relevant on Mac only **/
		monoVer: string;
		/** git version string, as returned by `git --version` **/
		gitVer: string;
		/** gradle version string as returned by `gradle -v` **/
		gradleVer: string;
		/** javac version string as returned by `javac -version` **/
		javacVersion: string;
		/** pod version string, as returned by `pod --version` **/
		cocoapodVer: string;
		/** xcodeproj gem location, as returned by `which gem xcodeproj` **/
		xcodeprojGemLocation: string;
		/** true id CocoaPods can successfully execute pod install **/
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
