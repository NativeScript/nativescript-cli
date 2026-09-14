import {
	IAnalyticsService,
	IDictionary,
	IErrors,
} from "../common/declarations";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { ErrorCodes } from "../common/enums";
import { hasValidAndroidSigning } from "../common/helpers";
import {
	ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE,
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
} from "../constants";
import { IOptions } from "../declarations";
import { ICleanupService } from "../definitions/cleanup-service";
import { IMigrateController } from "../definitions/migrate";
import { IPlatformEnvironmentRequirements } from "../definitions/platform";
import {
	IProjectData,
	ITestExecutionService,
	IVitestExecutionService,
} from "../definitions/project";

/** The platform spelling the test services receive, verbatim. */
type TestPlatform = "android" | "iOS" | "visionOS";

const testCommandOptions = {
	// The CLI-wide default is true; unit testing has always opted out of it.
	hmr: booleanOption({ default: false }),
	force: booleanOption(),
	watch: booleanOption(),
	justlaunch: booleanOption(),
	debugBrk: booleanOption(),
	device: stringOption(),
	emulator: booleanOption(),
	forDevice: booleanOption(),
	sdk: stringOption(),
	release: booleanOption(),
	aab: booleanOption(),
	keyStorePath: stringOption(),
	keyStorePassword: stringOption(),
	keyStoreAlias: stringOption(),
	keyStoreAliasPassword: stringOption(),
} satisfies CommandOptionsSchema;

export type TestCommandContext = CommandContext<typeof testCommandOptions>;

export interface ITestCommandServices {
	platform: string;
	$analyticsService: IAnalyticsService;
	$cleanupService: ICleanupService;
	$devicesService: Mobile.IDevicesService;
	$errors: IErrors;
	$liveSyncCommandHelper: ILiveSyncCommandHelper;
	$logger: ILogger;
	$migrateController: IMigrateController;
	$options: IOptions;
	$platformEnvironmentRequirements: IPlatformEnvironmentRequirements;
	$projectData: IProjectData;
	$testExecutionService: ITestExecutionService;
	$vitestExecutionService: IVitestExecutionService;
}

export function setupTestCommand(
	testPlatform: TestPlatform,
): ITestCommandServices {
	return {
		platform: testPlatform,
		$analyticsService: inject<IAnalyticsService>("analyticsService"),
		$cleanupService: inject<ICleanupService>("cleanupService"),
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
		$errors: inject<IErrors>("errors"),
		$liveSyncCommandHelper: inject<ILiveSyncCommandHelper>(
			"liveSyncCommandHelper",
		),
		$logger: inject<ILogger>("logger"),
		$migrateController: inject<IMigrateController>("migrateController"),
		$options: inject<IOptions>("options"),
		$platformEnvironmentRequirements: inject<IPlatformEnvironmentRequirements>(
			"platformEnvironmentRequirements",
		),
		$projectData: inject<IProjectData>("projectData"),
		$testExecutionService: inject<ITestExecutionService>(
			"testExecutionService",
		),
		$vitestExecutionService: inject<IVitestExecutionService>(
			"vitestExecutionService",
		),
	};
}

export async function canExecuteTestCommand(
	context: TestCommandContext,
	services: ITestCommandServices,
): Promise<boolean> {
	if (!context.options.force) {
		if (context.options.hmr) {
			// With HMR we are not restarting after LiveSync which is causing a 30 seconds app start on Android
			// because the Runtime does not watch for the `/data/local/tmp<appId>-livesync-in-progress` file deletion.
			// The App is closing itself after each test execution and the bug will be reproducible on each LiveSync.
			services.$errors.fail(
				"The `--hmr` option is not supported for this command.",
			);
		}

		await services.$migrateController.validate({
			projectDir: services.$projectData.projectDir,
			platforms: [services.platform],
		});
	}

	services.$projectData.initializeProjectData();
	services.$analyticsService.setShouldDispose(
		context.options.justlaunch || !context.options.watch,
	);
	services.$cleanupService.setShouldDispose(
		context.options.justlaunch || !context.options.watch,
	);

	const output =
		await services.$platformEnvironmentRequirements.checkEnvironmentRequirements(
			{
				platform: services.platform,
				projectDir: services.$projectData.projectDir,
				options: services.$options,
			},
		);

	if (services.$vitestExecutionService.isVitestProject(services.$projectData)) {
		const canStartTestRun = services.$vitestExecutionService.canStartTestRun(
			services.$projectData,
		);
		if (!canStartTestRun) {
			services.$errors.fail({
				formatStr:
					"Error: In order to run unit tests, your project must already be configured by running $ ns test init.",
				errorCode: ErrorCodes.TESTS_INIT_REQUIRED,
			});
		}
		return output.canExecute && canStartTestRun;
	}

	const canStartKarmaServer =
		await services.$testExecutionService.canStartKarmaServer(
			services.$projectData,
		);
	if (!canStartKarmaServer) {
		services.$errors.fail({
			formatStr:
				"Error: In order to run unit tests, your project must already be configured by running $ ns test init.",
			errorCode: ErrorCodes.TESTS_INIT_REQUIRED,
		});
	}

	return output.canExecute && canStartKarmaServer;
}

export async function runTestCommand(
	context: TestCommandContext,
	services: ITestCommandServices,
): Promise<void> {
	if (services.$vitestExecutionService.isVitestProject(services.$projectData)) {
		await services.$vitestExecutionService.startTestRun(
			services.platform,
			services.$projectData,
		);
		process.exit(0);
	}

	services.$logger.warn(
		"Karma-based unit testing is deprecated and will be removed in a future release. " +
			"Re-initialize your tests with '$ ns test init --framework vitest' to migrate.",
	);

	let devices = [];
	if (context.options.debugBrk) {
		await services.$devicesService.initialize({
			platform: services.platform,
			deviceId: context.options.device,
			emulator: context.options.emulator,
			skipInferPlatform: !services.platform,
			sdk: context.options.sdk,
		});

		const selectedDeviceForDebug =
			await services.$devicesService.pickSingleDevice({
				onlyEmulators: context.options.emulator,
				onlyDevices: context.options.forDevice,
				deviceId: context.options.device,
			});
		devices = [selectedDeviceForDebug];
		// const debugData = this.getDebugData(platform, projectData, deployOptions, { device: selectedDeviceForDebug.deviceInfo.identifier });
		// await this.$debugService.debug(debugData, this.$options);
	} else {
		devices = await services.$liveSyncCommandHelper.getDeviceInstances(
			services.platform,
		);
	}

	// The bundler reads unitTesting off the shared options service, so the flag
	// is set there rather than on the command's own snapshot.
	if (!services.$options.env) {
		services.$options.env = {};
	}
	services.$options.env.unitTesting = true;

	const liveSyncInfo = services.$liveSyncCommandHelper.getLiveSyncData(
		services.$projectData.projectDir,
	);

	const deviceDebugMap: IDictionary<boolean> = {};
	devices.forEach(
		(device) =>
			(deviceDebugMap[device.deviceInfo.identifier] = context.options.debugBrk),
	);

	const deviceDescriptors =
		await services.$liveSyncCommandHelper.createDeviceDescriptors(
			devices,
			services.platform,
			<any>{ deviceDebugMap },
		);

	await services.$testExecutionService.startKarmaServer(
		services.platform,
		liveSyncInfo,
		deviceDescriptors,
	);
	// if we got here, it means karma exited with exit code 0 (success)
	process.exit(0);
}

export const testCommandDefinition = defineCommand({
	name: "test|ios",
	description: "Runs the tests in your project on connected Apple devices.",
	options: testCommandOptions,
	// Arguments have never been rejected here, only ignored.
	arguments: "any",
	setup: () => setupTestCommand("iOS"),
	canExecute: canExecuteTestCommand,
	run: runTestCommand,
});

export const testAndroidCommandDefinition = defineCommand({
	name: "test|android",
	description:
		"Runs the tests in your project on connected Android devices or Android emulators.",
	options: testCommandOptions,
	arguments: "any",
	setup: () => setupTestCommand("android"),
	async canExecute(
		context: TestCommandContext,
		services: ITestCommandServices,
	): Promise<boolean> {
		const canExecuteBase = await canExecuteTestCommand(context, services);
		if (canExecuteBase) {
			if (
				(context.options.release || context.options.aab) &&
				!hasValidAndroidSigning(context.options)
			) {
				if (context.options.release) {
					services.$errors.failWithHelp(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
				} else {
					services.$errors.failWithHelp(
						ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE,
					);
				}
			}
		}

		return canExecuteBase;
	},
	run: runTestCommand,
});

export const testVisionOSCommandDefinition = defineCommand({
	name: ["test|vision", "test|visionos"],
	description:
		"Runs the tests in your project in the visionOS Simulator or on connected Apple Vision Pro devices.",
	options: testCommandOptions,
	arguments: "any",
	setup: () => setupTestCommand("visionOS"),
	async canExecute(
		context: TestCommandContext,
		services: ITestCommandServices,
	): Promise<boolean> {
		services.$projectData.initializeProjectData();
		// The Karma runner (v4 line) never supported visionOS — only the Vitest
		// path can drive it.
		if (
			!services.$vitestExecutionService.isVitestProject(services.$projectData)
		) {
			services.$errors.fail(
				"visionOS unit testing requires the Vitest runner. Run '$ ns test init --framework vitest' to configure your project.",
			);
		}

		return canExecuteTestCommand(context, services);
	},
	run: runTestCommand,
});
