import { IosLocalBuildRequirements } from "../lib/local-build-requirements/ios-local-build-requirements";
import { assert } from "chai";
import { HostInfo } from "../lib/host-info";
import { Constants } from "../lib/constants";

interface ITestCaseData {
	testName: string;
	expectedResult: boolean;
	getXcodeVersion?: string;
	minRequiredXcodeVersion?: number;
	getXcodeprojLocation?: string;
	isDarwin?: boolean;
}

describe("iOSLocalBuildRequirements", () => {
	const setupTestCase = (results: ITestCaseData): IosLocalBuildRequirements => {
		const sysInfo: NativeScriptDoctor.ISysInfo = <any>{
			getXcodeVersion: async (): Promise<string> => results.hasOwnProperty("getXcodeVersion") ? results.getXcodeVersion : "10.0",
			getXcodeprojLocation: async (): Promise<string> => results.hasOwnProperty("getXcodeprojLocation") ? results.getXcodeprojLocation : "path to xcodeproj",
		};

		const hostInfo: HostInfo = <any>{
			isDarwin: results.hasOwnProperty("isDarwin") ? results.isDarwin : true
		};

		const iOSLocalBuildRequirements = new IosLocalBuildRequirements(sysInfo, hostInfo);
		return iOSLocalBuildRequirements;
	};

	describe("isXcodeVersionValid", () => {
		const testCases: ITestCaseData[] = [
			{
				testName: "returns false when Xcode is not installed",
				getXcodeVersion: null,
				expectedResult: false
			},
			{
				testName: "returns false when Xcode's major version is below min required version",
				getXcodeVersion: "10.0",
				minRequiredXcodeVersion: 11,
				expectedResult: false
			},
			{
				testName: "returns true when Xcode's major version equals min required version",
				getXcodeVersion: "10.0",
				minRequiredXcodeVersion: 10,
				expectedResult: true
			},
			{
				testName: "returns true when Xcode's major version equals min required version",
				getXcodeVersion: "12.0",
				minRequiredXcodeVersion: 10,
				expectedResult: true
			}
		];

		testCases.forEach(testCase => {
			it(testCase.testName, async () => {
				const iOSLocalBuildRequirements = setupTestCase(testCase);
				const originalXcodeVersion = Constants.XCODE_MIN_REQUIRED_VERSION;
				Constants.XCODE_MIN_REQUIRED_VERSION = testCase.minRequiredXcodeVersion || Constants.XCODE_MIN_REQUIRED_VERSION;

				const isXcodeVersionValid = await iOSLocalBuildRequirements.isXcodeVersionValid();

				// Get back the XCODE_MIN_REQUIRED_VERSION value.
				Constants.XCODE_MIN_REQUIRED_VERSION = originalXcodeVersion;

				assert.equal(isXcodeVersionValid, testCase.expectedResult);
			});
		});
	});

	describe("checkRequirements", () => {
		const testCases: ITestCaseData[] = [
			{
				testName: "returns false when OS is not macOS",
				isDarwin: false,
				expectedResult: false
			},
			{
				testName: "returns false when Xcode is not installed",
				getXcodeVersion: null,
				expectedResult: false
			},
			{
				testName: "returns false when Xcode's major version is below min required version",
				getXcodeVersion: "10.0",
				minRequiredXcodeVersion: 11,
				expectedResult: false
			},
			{
				testName: "returns false when xcodeproj is not installed",
				getXcodeprojLocation: null,
				expectedResult: false
			},
			{
				testName: "returns true when Xcode's major version equals min required version",
				getXcodeVersion: "10.0",
				minRequiredXcodeVersion: 10,
				expectedResult: true
			},
			{
				testName: "returns true when Xcode's major version equals min required version",
				getXcodeVersion: "12.0",
				minRequiredXcodeVersion: 10,
				expectedResult: true
			}
		];

		testCases.forEach(testCase => {
			it(testCase.testName, async () => {
				const iOSLocalBuildRequirements = setupTestCase(testCase);
				const originalXcodeVersion = Constants.XCODE_MIN_REQUIRED_VERSION;
				Constants.XCODE_MIN_REQUIRED_VERSION = testCase.minRequiredXcodeVersion || Constants.XCODE_MIN_REQUIRED_VERSION;

				const isXcodeVersionValid = await iOSLocalBuildRequirements.checkRequirements();

				// Get back the XCODE_MIN_REQUIRED_VERSION value.
				Constants.XCODE_MIN_REQUIRED_VERSION = originalXcodeVersion;

				assert.equal(isXcodeVersionValid, testCase.expectedResult);
			});
		});
	});
});
