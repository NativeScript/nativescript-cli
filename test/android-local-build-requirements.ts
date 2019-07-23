import { AndroidLocalBuildRequirements } from '../lib/local-build-requirements/android-local-build-requirements';
import { assert } from "chai";

interface ITestCaseData {
	testName: string;
	validateInfo?: NativeScriptDoctor.IWarning[];
	validateJavacVersion?: NativeScriptDoctor.IWarning[];
	getJavaCompilerVersion?: string;
	getAdbVersion?: string;
}

describe("androidLocalBuildRequirements", () => {
	describe("checkRequirements", () => {
		const setupTestCase = (results: ITestCaseData): AndroidLocalBuildRequirements => {
			const androidToolsInfo: NativeScriptDoctor.IAndroidToolsInfo = {
				ANDROID_TARGET_PREFIX: "",
				androidHome: "",
				validateInfo: (): NativeScriptDoctor.IWarning[] => results.validateInfo || [],
				validateAndroidHomeEnvVariable: (): NativeScriptDoctor.IWarning[] => [],
				getToolsInfo: (): NativeScriptDoctor.IAndroidToolsInfoData => null,
				validateJavacVersion: (installedJavaVersion: string, projectDir?: string, runtimeVersion?: string): NativeScriptDoctor.IWarning[] => results.validateJavacVersion || [],
				getPathToAdbFromAndroidHome: async (): Promise<string> => undefined,
				getPathToEmulatorExecutable: (): string => undefined,
				validateMinSupportedTargetSdk: (): NativeScriptDoctor.IWarning[] => [],
				validataMaxSupportedTargetSdk: (): NativeScriptDoctor.IWarning[] => []
			};

			const sysInfo: NativeScriptDoctor.ISysInfo = {
				getJavaCompilerVersion: async (): Promise<string> => results.hasOwnProperty("getJavaCompilerVersion") ? results.getJavaCompilerVersion : "8.0.0",
				getJavaVersion: async (): Promise<string> => results.hasOwnProperty("getJavaVersion") ? results.getJavaCompilerVersion : "8.0.0",
				getJavaVersionFromJavaHome: async (): Promise<string> => results.hasOwnProperty("getJavaVersionFromJavaHome") ? results.getJavaCompilerVersion : "8.0.0",
				getJavaVersionFromPath: async (): Promise<string> => results.hasOwnProperty("getJavaVersionFromPath") ? results.getJavaCompilerVersion : "8.0.0",
				getAdbVersion: async (pathToAdb?: string): Promise<string> => results.hasOwnProperty("getAdbVersion") ? results.getAdbVersion : "1.0.39",
				getXcodeVersion: async (): Promise<string> => undefined,
				getNodeVersion: async (): Promise<string> => undefined,
				getNpmVersion: async (): Promise<string> => undefined,
				getNodeGypVersion: async (): Promise<string> => undefined,
				getXcodeprojLocation: async (): Promise<string> => undefined,
				isITunesInstalled: async (): Promise<boolean> => false,
				getCocoaPodsVersion: async (): Promise<string> => undefined,
				getOs: async (): Promise<string> => undefined,
				isAndroidInstalled: async (): Promise<boolean> => false,
				getMonoVersion: async (): Promise<string> => undefined,
				getGitVersion: async (): Promise<string> => undefined,
				getGitPath: async (): Promise<string> => undefined,
				getGradleVersion: async (): Promise<string> => undefined,
				isCocoaPodsWorkingCorrectly: async (): Promise<boolean> => false,
				getNativeScriptCliVersion: async (): Promise<string> => undefined,
				getXcprojInfo: async (): Promise<NativeScriptDoctor.IXcprojInfo> => null,
				isCocoaPodsUpdateRequired: async (): Promise<boolean> => true,
				isAndroidSdkConfiguredCorrectly: async (): Promise<boolean> => true,
				getSysInfo: async (config?: NativeScriptDoctor.ISysInfoConfig): Promise<NativeScriptDoctor.ISysInfoData> => null,
				setShouldCacheSysInfo: (shouldCache: boolean): void => undefined
			};

			const androidLocalBuildRequirements = new AndroidLocalBuildRequirements(androidToolsInfo, sysInfo);
			return androidLocalBuildRequirements;
		};

		it("returns true when everything is setup correctly", async () => {
			const androidLocalBuildRequirements = setupTestCase({ testName: "returns true when everything is setup correctly" });
			const result = await androidLocalBuildRequirements.checkRequirements();
			assert.isTrue(result);
		});

		describe("returns false", () => {
			const getWarnings = (): NativeScriptDoctor.IWarning[] => {
				return [{
					warning: "warning",
					additionalInformation: "additional info",
					platforms: ["android"]
				}];
			};
			const testData: ITestCaseData[] = [
				{
					testName: "when java is not installed",
					getJavaCompilerVersion: null
				},
				{
					testName: "when java is installed, but it is not compatible for current project",
					validateJavacVersion: getWarnings()
				},
				{
					testName: "when Android tools are not installed correctly",
					validateInfo: getWarnings()
				},
				{
					testName: "when adb cannot be found",
					getAdbVersion: null
				}
			];

			testData.forEach(testCase => {
				it(testCase.testName, async () => {
					const androidLocalBuildRequirements = setupTestCase(testCase);
					const result = await androidLocalBuildRequirements.checkRequirements();
					assert.isFalse(result);
				});
			});
		});
	});
});
