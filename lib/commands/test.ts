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

type TestCommandContext = CommandContext<typeof testCommandOptions>;

async function canExecuteTestCommand(
	context: TestCommandContext,
	platform: TestPlatform,
): Promise<boolean> {
	const $analyticsService =
		context.injector.get<IAnalyticsService>("analyticsService");
	const $cleanupService =
		context.injector.get<ICleanupService>("cleanupService");
	const $errors = context.injector.get<IErrors>("errors");
	const $migrateController =
		context.injector.get<IMigrateController>("migrateController");
	const $options = context.injector.get<IOptions>("options");
	const $platformEnvironmentRequirements =
		context.injector.get<IPlatformEnvironmentRequirements>(
			"platformEnvironmentRequirements",
		);
	const $projectData = context.injector.get<IProjectData>("projectData");
	const $testExecutionService = context.injector.get<ITestExecutionService>(
		"testExecutionService",
	);
	const $vitestExecutionService = context.injector.get<IVitestExecutionService>(
		"vitestExecutionService",
	);

	if (!context.options.force) {
		if (context.options.hmr) {
			// With HMR we are not restarting after LiveSync which is causing a 30 seconds app start on Android
			// because the Runtime does not watch for the `/data/local/tmp<appId>-livesync-in-progress` file deletion.
			// The App is closing itself after each test execution and the bug will be reproducible on each LiveSync.
			$errors.fail("The `--hmr` option is not supported for this command.");
		}

		await $migrateController.validate({
			projectDir: $projectData.projectDir,
			platforms: [platform],
		});
	}

	$projectData.initializeProjectData();
	$analyticsService.setShouldDispose(
		context.options.justlaunch || !context.options.watch,
	);
	$cleanupService.setShouldDispose(
		context.options.justlaunch || !context.options.watch,
	);

	const output =
		await $platformEnvironmentRequirements.checkEnvironmentRequirements({
			platform,
			projectDir: $projectData.projectDir,
			options: $options,
		});

	if ($vitestExecutionService.isVitestProject($projectData)) {
		const canStartTestRun =
			await $vitestExecutionService.canStartTestRun($projectData);
		if (!canStartTestRun) {
			$errors.fail({
				formatStr:
					"Error: In order to run unit tests, your project must already be configured by running $ ns test init.",
				errorCode: ErrorCodes.TESTS_INIT_REQUIRED,
			});
		}
		return output.canExecute && canStartTestRun;
	}

	const canStartKarmaServer =
		await $testExecutionService.canStartKarmaServer($projectData);
	if (!canStartKarmaServer) {
		$errors.fail({
			formatStr:
				"Error: In order to run unit tests, your project must already be configured by running $ ns test init.",
			errorCode: ErrorCodes.TESTS_INIT_REQUIRED,
		});
	}

	return output.canExecute && canStartKarmaServer;
}

async function runTestCommand(
	context: TestCommandContext,
	platform: TestPlatform,
): Promise<void> {
	const $devicesService =
		context.injector.get<Mobile.IDevicesService>("devicesService");
	const $liveSyncCommandHelper = context.injector.get<ILiveSyncCommandHelper>(
		"liveSyncCommandHelper",
	);
	const $logger = context.injector.get<ILogger>("logger");
	const $options = context.injector.get<IOptions>("options");
	const $projectData = context.injector.get<IProjectData>("projectData");
	const $testExecutionService = context.injector.get<ITestExecutionService>(
		"testExecutionService",
	);
	const $vitestExecutionService = context.injector.get<IVitestExecutionService>(
		"vitestExecutionService",
	);

	if ($vitestExecutionService.isVitestProject($projectData)) {
		await $vitestExecutionService.startTestRun(platform, $projectData);
		process.exit(0);
	}

	$logger.warn(
		"Karma-based unit testing is deprecated and will be removed in a future release. " +
			"Re-initialize your tests with '$ ns test init --framework vitest' to migrate.",
	);

	let devices = [];
	if (context.options.debugBrk) {
		await $devicesService.initialize({
			platform,
			deviceId: context.options.device,
			emulator: context.options.emulator,
			skipInferPlatform: !platform,
			sdk: context.options.sdk,
		});

		const selectedDeviceForDebug = await $devicesService.pickSingleDevice({
			onlyEmulators: context.options.emulator,
			onlyDevices: context.options.forDevice,
			deviceId: context.options.device,
		});
		devices = [selectedDeviceForDebug];
		// const debugData = this.getDebugData(platform, projectData, deployOptions, { device: selectedDeviceForDebug.deviceInfo.identifier });
		// await this.$debugService.debug(debugData, this.$options);
	} else {
		devices = await $liveSyncCommandHelper.getDeviceInstances(platform);
	}

	// The bundler reads unitTesting off the shared options service, so the flag
	// is set there rather than on the command's own snapshot.
	if (!$options.env) {
		$options.env = {};
	}
	$options.env.unitTesting = true;

	const liveSyncInfo = $liveSyncCommandHelper.getLiveSyncData(
		$projectData.projectDir,
	);

	const deviceDebugMap: IDictionary<boolean> = {};
	devices.forEach(
		(device) =>
			(deviceDebugMap[device.deviceInfo.identifier] = context.options.debugBrk),
	);

	const deviceDescriptors =
		await $liveSyncCommandHelper.createDeviceDescriptors(devices, platform, <
			any
		>{ deviceDebugMap });

	await $testExecutionService.startKarmaServer(
		platform,
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
	canExecute: (context: TestCommandContext) =>
		canExecuteTestCommand(context, "iOS"),
	run: (context: TestCommandContext) => runTestCommand(context, "iOS"),
});

export const testAndroidCommandDefinition = defineCommand({
	name: "test|android",
	description:
		"Runs the tests in your project on connected Android devices or Android emulators.",
	options: testCommandOptions,
	arguments: "any",
	async canExecute(context: TestCommandContext): Promise<boolean> {
		const $errors = inject<IErrors>("errors");

		const canExecuteBase = await canExecuteTestCommand(context, "android");
		if (canExecuteBase) {
			if (
				(context.options.release || context.options.aab) &&
				!hasValidAndroidSigning(context.options)
			) {
				if (context.options.release) {
					$errors.failWithHelp(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
				} else {
					$errors.failWithHelp(ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE);
				}
			}
		}

		return canExecuteBase;
	},
	run: (context: TestCommandContext) => runTestCommand(context, "android"),
});

export const testVisionOSCommandDefinition = defineCommand({
	name: ["test|vision", "test|visionos"],
	description:
		"Runs the tests in your project in the visionOS Simulator or on connected Apple Vision Pro devices.",
	options: testCommandOptions,
	arguments: "any",
	async canExecute(context: TestCommandContext): Promise<boolean> {
		const $errors = inject<IErrors>("errors");
		const $projectData = inject<IProjectData>("projectData");
		const $vitestExecutionService = inject<IVitestExecutionService>(
			"vitestExecutionService",
		);

		$projectData.initializeProjectData();
		// The Karma runner (v4 line) never supported visionOS — only the Vitest
		// path can drive it.
		if (!$vitestExecutionService.isVitestProject($projectData)) {
			$errors.fail(
				"visionOS unit testing requires the Vitest runner. Run '$ ns test init --framework vitest' to configure your project.",
			);
		}

		return canExecuteTestCommand(context, "visionOS");
	},
	run: (context: TestCommandContext) => runTestCommand(context, "visionOS"),
});
