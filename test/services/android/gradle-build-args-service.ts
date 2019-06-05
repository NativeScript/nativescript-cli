import { Yok } from "../../../lib/common/yok";
import { GradleBuildArgsService } from "../../../lib/services/android/gradle-build-args-service";
import { assert } from "chai";

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("androidToolsInfo", {
		getToolsInfo: () => ({
			compileSdkVersion: 28,
			targetSdkVersion: 26,
			buildToolsVersion: "my-build-tools-version",
			generateTypings: true
		})
	});
	injector.register("logger", {});
	injector.register("gradleBuildArgsService", GradleBuildArgsService);

	return injector;
}

function executeTests(testCases: any[], testFunction: (gradleBuildArgsService: IGradleBuildArgsService, buildData: IAndroidBuildData) => string[]) {
	_.each(testCases, testCase => {
		it(testCase.name, () => {
			const injector = createTestInjector();
			if (testCase.logLevel) {
				const logger = injector.resolve("logger");
				logger.getLevel = () => testCase.logLevel;
			}

			const gradleBuildArgsService = injector.resolve("gradleBuildArgsService");
			const args = testFunction(gradleBuildArgsService, testCase.buildConfig);

			assert.deepEqual(args, testCase.expectedResult);
		});
	});
}

const expectedInfoLoggingArgs = ["--quiet"];
const expectedTraceLoggingArgs = ["--stacktrace", "--debug"];
const expectedDebugBuildArgs = ["-PcompileSdk=android-28", "-PtargetSdk=26", "-PbuildToolsVersion=my-build-tools-version", "-PgenerateTypings=true"];
const expectedReleaseBuildArgs = expectedDebugBuildArgs.concat(["-Prelease", "-PksPath=/my/key/store/path",
	"-Palias=keyStoreAlias", "-Ppassword=keyStoreAliasPassword", "-PksPassword=keyStorePassword"]);

const releaseBuildConfig = {
	release: true,
	keyStorePath: "/my/key/store/path",
	keyStoreAlias: "keyStoreAlias",
	keyStoreAliasPassword: "keyStoreAliasPassword",
	keyStorePassword: "keyStorePassword"
};

describe("GradleBuildArgsService", () => {
	describe("getBuildTaskArgs", () => {
		const testCases = [
			{
				name: "should return correct args for debug build with info log",
				buildConfig: { release: false },
				logLevel: "INFO",
				expectedResult: ["assembleDebug"].concat(expectedInfoLoggingArgs).concat(expectedDebugBuildArgs)
			},
			{
				name: "should return correct args for debug build with trace log",
				buildConfig: { release: false },
				logLevel: "TRACE",
				expectedResult: ["assembleDebug"].concat(expectedTraceLoggingArgs).concat(expectedDebugBuildArgs)
			},
			{
				name: "should return correct args for release build with info log",
				buildConfig: releaseBuildConfig,
				logLevel: "INFO",
				expectedResult: ["assembleRelease"].concat(expectedInfoLoggingArgs).concat(expectedReleaseBuildArgs)
			},
			{
				name: "should return correct args for release build with trace log",
				buildConfig: releaseBuildConfig,
				logLevel: "TRACE",
				expectedResult: ["assembleRelease"].concat(expectedTraceLoggingArgs).concat(expectedReleaseBuildArgs)
			},
			{
				name: "should return correct args for debug build with info log and android bundle",
				buildConfig: { release: false, androidBundle: true },
				logLevel: "INFO",
				expectedResult: ["bundleDebug"].concat(expectedInfoLoggingArgs).concat(expectedDebugBuildArgs)
			},
			{
				name: "should return correct args for debug build with trace log and android bundle",
				buildConfig: { release: false, androidBundle: true },
				logLevel: "TRACE",
				expectedResult: ["bundleDebug"].concat(expectedTraceLoggingArgs).concat(expectedDebugBuildArgs)
			},
			{
				name: "should return correct args for release build with info log and android bundle",
				buildConfig: { ...releaseBuildConfig, androidBundle: true },
				logLevel: "INFO",
				expectedResult: ["bundleRelease"].concat(expectedInfoLoggingArgs).concat(expectedReleaseBuildArgs)
			},
			{
				name: "should return correct args for release build with trace log and android bundle",
				buildConfig: { ...releaseBuildConfig, androidBundle: true },
				logLevel: "TRACE",
				expectedResult: ["bundleRelease"].concat(expectedTraceLoggingArgs).concat(expectedReleaseBuildArgs)
			}
		];

		executeTests(testCases, (gradleBuildArgsService: IGradleBuildArgsService, buildData: IAndroidBuildData) => gradleBuildArgsService.getBuildTaskArgs(buildData));
	});

	describe("getCleanTaskArgs", () => {
		const testCases = [
			{
				name: "should return correct args for debug clean build with info log",
				buildConfig: { release: false },
				logLevel: "INFO",
				expectedResult: ["clean"].concat(expectedInfoLoggingArgs).concat(expectedDebugBuildArgs)
			},
			{
				name: "should return correct args for debug clean build with trace log",
				buildConfig: { release: false },
				logLevel: "TRACE",
				expectedResult: ["clean"].concat(expectedTraceLoggingArgs).concat(expectedDebugBuildArgs)
			},
			{
				name: "should return correct args for release clean build with info log",
				buildConfig: releaseBuildConfig,
				logLevel: "INFO",
				expectedResult: ["clean"].concat(expectedInfoLoggingArgs).concat(expectedReleaseBuildArgs)
			},
			{
				name: "should return correct args for release clean build with trace log",
				buildConfig: releaseBuildConfig,
				logLevel: "TRACE",
				expectedResult: ["clean"].concat(expectedTraceLoggingArgs).concat(expectedReleaseBuildArgs)
			},
			{
				name: "should return correct args for debug clean build with info log and android bundle",
				buildConfig: { release: false, androidBundle: true },
				logLevel: "INFO",
				expectedResult: ["clean"].concat(expectedInfoLoggingArgs).concat(expectedDebugBuildArgs)
			},
			{
				name: "should return correct args for debug clean build with trace log and android bundle",
				buildConfig: { release: false, androidBundle: true },
				logLevel: "TRACE",
				expectedResult: ["clean"].concat(expectedTraceLoggingArgs).concat(expectedDebugBuildArgs)
			},
			{
				name: "should return correct args for release clean build with info log and android bundle",
				buildConfig: { ...releaseBuildConfig, androidBundle: true },
				logLevel: "INFO",
				expectedResult: ["clean"].concat(expectedInfoLoggingArgs).concat(expectedReleaseBuildArgs)
			},
			{
				name: "should return correct args for release clean build with trace log and android bundle",
				buildConfig: { ...releaseBuildConfig, androidBundle: true },
				logLevel: "TRACE",
				expectedResult: ["clean"].concat(expectedTraceLoggingArgs).concat(expectedReleaseBuildArgs)
			}
		];

		executeTests(testCases, (gradleBuildArgsService: IGradleBuildArgsService, buildData: IAndroidBuildData) => gradleBuildArgsService.getCleanTaskArgs(buildData));
	});
});
