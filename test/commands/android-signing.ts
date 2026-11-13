import { assert } from "chai";
import { BuildAndroidCommand } from "../../lib/commands/build";
import { RunAndroidCommand } from "../../lib/commands/run";
import {
	ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE,
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
} from "../../lib/constants";

const keyStore = {
	keyStorePath: "debug.keystore",
	keyStorePassword: "android",
	keyStoreAlias: "androiddebugkey",
	keyStoreAliasPassword: "android",
};

const errors = {
	failWithHelp: (message: string): never => {
		throw new Error(message);
	},
	fail: (message: string): never => {
		throw new Error(message);
	},
};

const devicePlatformsConstants = { Android: "Android" };

const platformValidationService = {
	isPlatformSupportedForOS: () => true,
	validateOptions: async () => true,
};

const platformsDataService = {
	getPlatformData: () => ({
		platformProjectService: {
			validate: async () => ({
				checkEnvironmentRequirementsOutput: { canExecute: true },
			}),
		},
	}),
};

function buildCommand(options: any): BuildAndroidCommand {
	return new BuildAndroidCommand(
		options,
		<any>errors,
		<any>{ initializeProjectData: (): void => undefined },
		<any>platformsDataService,
		<any>devicePlatformsConstants,
		<any>{},
		<any>platformValidationService,
		<any>{ validateRuntimeVersion: (): void => undefined },
		<any>{},
		<any>{},
		<any>{ validate: async () => true },
	);
}

function runCommand(options: any): RunAndroidCommand {
	return new RunAndroidCommand(
		<any>devicePlatformsConstants,
		<any>errors,
		<any>{ resolve: () => ({ canExecute: async () => true }) },
		options,
		<any>platformValidationService,
		<any>{},
	);
}

const cases = [
	{
		name: "a build with --key-store-* options",
		options: { release: true, ...keyStore },
	},
	{
		name: "a compiled build without --key-store-* options",
		options: { release: true, compiled: true },
	},
	{
		name: "a compiled build with --key-store-* options",
		options: { release: true, compiled: true, ...keyStore },
	},
	{
		name: "a release build without --key-store-* options",
		options: { release: true },
		error: ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
	},
	{
		name: "a compiled App Bundle without --key-store-* options",
		options: { release: true, compiled: true, aab: true },
		error: ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE,
	},
];

describe("Android signing options", () => {
	for (const [commandName, create] of <const>[
		["build android", buildCommand],
		["run android", runCommand],
	]) {
		describe(commandName, () => {
			for (const testCase of cases) {
				it(`${testCase.error ? "refuses" : "accepts"} ${testCase.name}`, async () => {
					const canExecute = create({
						force: true,
						...testCase.options,
					}).canExecute([]);
					if (testCase.error) {
						await assert.isRejected(canExecute, testCase.error);
					} else {
						assert.isTrue(await canExecute);
					}
				});
			}
		});
	}
});
