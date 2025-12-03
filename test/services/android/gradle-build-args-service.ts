import { Yok } from "../../../lib/common/yok";
import { GradleBuildArgsService } from "../../../lib/services/android/gradle-build-args-service";
import * as stubs from "../../stubs";
import { assert } from "chai";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { IGradleBuildArgsService } from "../../../lib/definitions/gradle";
import { IAndroidBuildData } from "../../../lib/definitions/build";
import { IInjector } from "../../../lib/common/definitions/yok";
import * as path from "path";

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("androidToolsInfo", {
		getToolsInfo: () => ({
			compileSdkVersion: 28,
			targetSdkVersion: 26,
			buildToolsVersion: "my-build-tools-version",
			generateTypings: true,
		}),
	});
	injector.register("logger", {});
	const projectData = new stubs.ProjectDataStub();
	projectData.projectDir = "/path/to/projectDir";
	injector.register("projectData", projectData);
	injector.register("hooksService", stubs.HooksServiceStub);
	injector.register("gradleBuildArgsService", GradleBuildArgsService);
	injector.register("analyticsService", stubs.AnalyticsService);
	injector.register("staticConfig", {
		TRACK_FEATURE_USAGE_SETTING_NAME: "TrackFeatureUsage",
	});

	return injector;
}

async function executeTests(
	testCases: any[],
	testFunction: (
		gradleBuildArgsService: IGradleBuildArgsService,
		buildData: IAndroidBuildData,
	) => Promise<string[]>,
) {
	for (const testCase of testCases) {
		it(testCase.name, async () => {
			const injector = createTestInjector();
			if (testCase.logLevel) {
				const logger = injector.resolve("logger");
				logger.getLevel = () => testCase.logLevel;
			}

			const gradleBuildArgsService = injector.resolve("gradleBuildArgsService");
			const args = await testFunction(
				gradleBuildArgsService,
				testCase.buildConfig,
			);

			assert.deepStrictEqual(args, testCase.expectedResult);
		});
	}
}
const ksDir = mkdtempSync(path.join(tmpdir(), "ksPath-"));
const ksPath = path.join(ksDir, "keystore.jks");
const expectedInfoLoggingArgs = ["--info"];
const expectedTraceLoggingArgs = ["--debug"];
const expectedDebugBuildArgs = [
	"--stacktrace",
	"-PcompileSdk=28",
	"-PtargetSdk=26",
	"-PbuildToolsVersion=my-build-tools-version",
	"-PgenerateTypings=true",
	"-PprojectRoot=/path/to/projectDir",
	"-DprojectRoot=/path/to/projectDir",
	"-PappPath=/path/to/projectDir/app".replace(/\//g, path.sep),
	"-PappBuildPath=platforms",
	"-DappBuildPath=platforms",
	"-PappPath=/path/to/projectDir/app",
	"-PappResourcesPath=/path/to/projectDir/app/App_Resources".replace(
		/\//g,
		path.sep,
	),
];
const expectedReleaseBuildArgs = expectedDebugBuildArgs.concat([
	"-Prelease",
	`-PksPath=${ksPath}`,
	"-Palias=keyStoreAlias",
	"-Ppassword=keyStoreAliasPassword",
	"-PksPassword=keyStorePassword",
]);

const releaseBuildConfig = {
	release: true,
	keyStorePath: ksPath,
	keyStoreAlias: "keyStoreAlias",
	keyStoreAliasPassword: "keyStoreAliasPassword",
	keyStorePassword: "keyStorePassword",
};

describe("GradleBuildArgsService", () => {
	describe("getBuildTaskArgs", async () => {
		const testCases = [
			{
				name: "should return correct args for debug build with info log",
				buildConfig: { release: false },
				logLevel: "INFO",
				expectedResult: ["assembleDebug"]
					.concat(expectedInfoLoggingArgs)
					.concat(expectedDebugBuildArgs),
			},
			{
				name: "should return correct args for debug build with trace log",
				buildConfig: { release: false },
				logLevel: "TRACE",
				expectedResult: ["assembleDebug"]
					.concat(expectedTraceLoggingArgs)
					.concat(expectedDebugBuildArgs),
			},
			{
				name: "should return correct args for release build with info log",
				buildConfig: releaseBuildConfig,
				logLevel: "INFO",
				expectedResult: ["assembleRelease"]
					.concat(expectedInfoLoggingArgs)
					.concat(expectedReleaseBuildArgs),
			},
			{
				name: "should return correct args for release build with trace log",
				buildConfig: releaseBuildConfig,
				logLevel: "TRACE",
				expectedResult: ["assembleRelease"]
					.concat(expectedTraceLoggingArgs)
					.concat(expectedReleaseBuildArgs),
			},
			{
				name: "should return correct args for debug build with info log and android bundle",
				buildConfig: { release: false, androidBundle: true },
				logLevel: "INFO",
				expectedResult: ["bundleDebug"]
					.concat(expectedInfoLoggingArgs)
					.concat(expectedDebugBuildArgs),
			},
			{
				name: "should return correct args for debug build with trace log and android bundle",
				buildConfig: { release: false, androidBundle: true },
				logLevel: "TRACE",
				expectedResult: ["bundleDebug"]
					.concat(expectedTraceLoggingArgs)
					.concat(expectedDebugBuildArgs),
			},
			{
				name: "should return correct args for release build with info log and android bundle",
				buildConfig: { ...releaseBuildConfig, androidBundle: true },
				logLevel: "INFO",
				expectedResult: ["bundleRelease"]
					.concat(expectedInfoLoggingArgs)
					.concat(expectedReleaseBuildArgs),
			},
			{
				name: "should return correct args for release build with trace log and android bundle",
				buildConfig: { ...releaseBuildConfig, androidBundle: true },
				logLevel: "TRACE",
				expectedResult: ["bundleRelease"]
					.concat(expectedTraceLoggingArgs)
					.concat(expectedReleaseBuildArgs),
			},
		];

		await executeTests(
			testCases,
			(
				gradleBuildArgsService: IGradleBuildArgsService,
				buildData: IAndroidBuildData,
			) => gradleBuildArgsService.getBuildTaskArgs(buildData),
		);
	});

	describe("getCleanTaskArgs", async () => {
		const testCases = [
			{
				name: "should return correct args for debug clean build with info log",
				buildConfig: { release: false },
				logLevel: "INFO",
				expectedResult: ["clean"]
					.concat(expectedInfoLoggingArgs)
					.concat(expectedDebugBuildArgs),
			},
			{
				name: "should return correct args for debug clean build with trace log",
				buildConfig: { release: false },
				logLevel: "TRACE",
				expectedResult: ["clean"]
					.concat(expectedTraceLoggingArgs)
					.concat(expectedDebugBuildArgs),
			},
			{
				name: "should return correct args for release clean build with info log",
				buildConfig: releaseBuildConfig,
				logLevel: "INFO",
				expectedResult: ["clean"]
					.concat(expectedInfoLoggingArgs)
					.concat(expectedReleaseBuildArgs),
			},
			{
				name: "should return correct args for release clean build with trace log",
				buildConfig: releaseBuildConfig,
				logLevel: "TRACE",
				expectedResult: ["clean"]
					.concat(expectedTraceLoggingArgs)
					.concat(expectedReleaseBuildArgs),
			},
			{
				name: "should return correct args for debug clean build with info log and android bundle",
				buildConfig: { release: false, androidBundle: true },
				logLevel: "INFO",
				expectedResult: ["clean"]
					.concat(expectedInfoLoggingArgs)
					.concat(expectedDebugBuildArgs),
			},
			{
				name: "should return correct args for debug clean build with trace log and android bundle",
				buildConfig: { release: false, androidBundle: true },
				logLevel: "TRACE",
				expectedResult: ["clean"]
					.concat(expectedTraceLoggingArgs)
					.concat(expectedDebugBuildArgs),
			},
			{
				name: "should return correct args for release clean build with info log and android bundle",
				buildConfig: { ...releaseBuildConfig, androidBundle: true },
				logLevel: "INFO",
				expectedResult: ["clean"]
					.concat(expectedInfoLoggingArgs)
					.concat(expectedReleaseBuildArgs),
			},
			{
				name: "should return correct args for release clean build with trace log and android bundle",
				buildConfig: { ...releaseBuildConfig, androidBundle: true },
				logLevel: "TRACE",
				expectedResult: ["clean"]
					.concat(expectedTraceLoggingArgs)
					.concat(expectedReleaseBuildArgs),
			},
		];

		await executeTests(
			testCases,
			(
				gradleBuildArgsService: IGradleBuildArgsService,
				buildData: IAndroidBuildData,
			) => Promise.resolve(gradleBuildArgsService.getCleanTaskArgs(buildData)),
		);
	});
});
