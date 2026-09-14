import * as fs from "fs";
import { platform as currentPlatform } from "os";
import * as path from "path";
import { IChildProcess, IXcodeSelectService } from "../common/declarations";
import {
	booleanOption,
	CommandOptionsSchema,
	defineCommand,
} from "../common/define-command";
import { ICommand } from "../common/definitions/commands";
import { inject } from "../common/di";
import { injector } from "../common/yok";
import { IOptions } from "../declarations";
import { IProjectData } from "../definitions/project";
import type { IOSProjectService } from "../services/ios-project-service";

export function injectOpenXcodeProjectServices() {
	return {
		$iOSProjectService: inject<IOSProjectService>("iOSProjectService"),
		$logger: inject<ILogger>("logger"),
		$childProcess: inject<IChildProcess>("childProcess"),
		$projectData: inject<IProjectData>("projectData"),
		$xcodeSelectService: inject<IXcodeSelectService>("xcodeSelectService"),
		$xcodebuildArgsService: inject<IXcodebuildArgsService>(
			"xcodebuildArgsService",
		),
	};
}

export type IOpenXcodeProjectServices = ReturnType<
	typeof injectOpenXcodeProjectServices
>;

export function injectOpenAndroidStudioServices() {
	return {
		$logger: inject<ILogger>("logger"),
		$liveSyncCommandHelper: inject<ILiveSyncCommandHelper>(
			"liveSyncCommandHelper",
		),
		$childProcess: inject<IChildProcess>("childProcess"),
		$projectData: inject<IProjectData>("projectData"),
	};
}

export type IOpenAndroidStudioServices = ReturnType<
	typeof injectOpenAndroidStudioServices
>;

export function getAndroidStudioPath(): string | null {
	const os = currentPlatform();

	if (os === "darwin") {
		const possibleStudioPaths = [
			"/Applications/Android Studio.app",
			`${process.env.HOME}/Applications/Android Studio.app`,
		];

		return possibleStudioPaths.find((p) => fs.existsSync(p)) || null;
	} else if (os === "win32") {
		const studioPath = path.join(
			"C:",
			"Program Files",
			"Android",
			"Android Studio",
			"bin",
			"studio64.exe",
		);
		return fs.existsSync(studioPath) ? studioPath : null;
	} else if (os === "linux") {
		const studioPath = "/usr/local/android-studio/bin/studio.sh";
		return fs.existsSync(studioPath) ? studioPath : null;
	}

	return null;
}

/**
 * `isInteractive` reflects the caller, not the terminal: a key command runs
 * while `ns run` owns stdin and has to hand it back after `prepare` consumed
 * it, a one-shot CLI command exits instead.
 */
export async function openAndroidStudioProject(
	services: IOpenAndroidStudioServices,
	platform: string,
	isInteractive: boolean,
): Promise<void> {
	services.$liveSyncCommandHelper.validatePlatform(platform);
	services.$projectData.initializeProjectData();
	const androidDir = `${services.$projectData.platformsDir}/android`;

	if (!fs.existsSync(androidDir)) {
		const prepareCommand = injector.resolveCommand("prepare") as ICommand;
		await prepareCommand.execute([platform]);
		if (isInteractive) {
			process.stdin.resume();
		}
	}

	let studioPath = null;

	studioPath = process.env.NATIVESCRIPT_ANDROID_STUDIO_PATH;

	if (!studioPath) {
		studioPath = getAndroidStudioPath();

		if (!studioPath) {
			services.$logger.error(
				"Android Studio is not installed, or is not in a standard location. Use NATIVESCRIPT_ANDROID_STUDIO_PATH.",
			);
			return;
		}
	}

	const os = currentPlatform();
	if (os === "darwin") {
		services.$childProcess.exec(`open -a "${studioPath}" ${androidDir}`);
	} else if (os === "win32") {
		const child = services.$childProcess.spawn(studioPath, [androidDir], {
			detached: true,
			stdio: "ignore",
		});
		child.unref();
	} else if (os === "linux") {
		services.$childProcess.exec(`${studioPath} ${androidDir}`);
	}
}

export async function openXcodeProject(
	services: IOpenXcodeProjectServices,
	platformDirName: string,
	isInteractive: boolean,
): Promise<void> {
	const os = currentPlatform();
	if (os !== "darwin") {
		services.$logger.error("Opening a project in XCode requires macOS.");
		return;
	}

	services.$projectData.initializeProjectData();
	const platformDir = path.resolve(
		services.$projectData.platformsDir,
		platformDirName,
	);

	if (!fs.existsSync(platformDir)) {
		const prepareCommand = injector.resolveCommand("prepare") as ICommand;

		await prepareCommand.execute([platformDirName]);
		if (isInteractive) {
			process.stdin.resume();
		}
	}
	const platformData = services.$iOSProjectService.getPlatformData(
		services.$projectData,
	);
	const xcprojectFile = services.$xcodebuildArgsService.getXcodeProjectArgs(
		platformData,
		services.$projectData,
	)[1];

	if (fs.existsSync(xcprojectFile)) {
		services.$xcodeSelectService
			.getDeveloperDirectoryPath()
			.then(() => services.$childProcess.exec(`open ${xcprojectFile}`, {}))
			.catch((e) => {
				services.$logger.error(e.message);
			});
	} else {
		services.$logger.error(`Unable to open project file: ${xcprojectFile}`);
	}
}

export async function openVisionOSProject(
	services: IOpenXcodeProjectServices,
	$options: IOptions,
	isInteractive: boolean,
): Promise<void> {
	$options.platformOverride = "visionOS";
	await openXcodeProject(services, "visionos", isInteractive);
	$options.platformOverride = null;
}

const openCommandOptions = {
	watch: booleanOption({ default: false }),
} satisfies CommandOptionsSchema;

/**
 * `prepare` reads the options service rather than this command's context, so
 * the CLI-wide `--watch` has to be pinned there and not just defaulted here.
 * It is restored afterwards because a key shortcut runs this inside a process
 * whose own live sync is still watching.
 */
const withoutWatch = async <T>(
	$options: IOptions,
	work: () => Promise<T>,
): Promise<T> => {
	const previous = $options.watch;
	$options.watch = false;
	try {
		return await work();
	} finally {
		$options.watch = previous;
	}
};

export const iosOpenCommand = defineCommand({
	name: "open|ios",
	description: "Opens the project in Xcode.",
	options: openCommandOptions,
	arguments: "none",
	setup() {
		return {
			...injectOpenXcodeProjectServices(),
			$options: inject<IOptions>("options"),
		};
	},
	async run(context, services): Promise<void> {
		await withoutWatch(services.$options, () =>
			openXcodeProject(services, "ios", false),
		);
	},
});

export const visionOpenCommand = defineCommand({
	name: ["open|visionos", "open|vision"],
	description: "Opens the visionOS project in Xcode.",
	options: openCommandOptions,
	arguments: "none",
	setup() {
		return {
			...injectOpenXcodeProjectServices(),
			$options: inject<IOptions>("options"),
		};
	},
	async run(context, services): Promise<void> {
		await withoutWatch(services.$options, () =>
			openVisionOSProject(services, services.$options, false),
		);
	},
});

export const androidOpenCommand = defineCommand({
	name: "open|android",
	description: "Opens the project in Android Studio.",
	options: openCommandOptions,
	arguments: "none",
	setup() {
		return {
			...injectOpenAndroidStudioServices(),
			$options: inject<IOptions>("options"),
		};
	},
	async run(context, services): Promise<void> {
		await withoutWatch(services.$options, () =>
			openAndroidStudioProject(services, "Android", false),
		);
	},
});
