import * as fs from "fs";
import { platform as currentPlatform } from "os";
import * as path from "path";
import { IChildProcess, IXcodeSelectService } from "../common/declarations";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
} from "../common/define-command";
import { ICommand } from "../common/definitions/commands";
import { inject } from "../common/di";
import { injector } from "../common/yok";
import { IOptions } from "../declarations";
import type { IOSProjectService } from "../services/ios-project-service";
import { ProjectData } from "../contracts/project-data";
import { provideProject } from "./command-base";

function getAndroidStudioPath(): string | null {
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
async function openAndroidStudioProject(
	context: CommandContext,
	platform: string,
	isInteractive: boolean,
): Promise<void> {
	const $childProcess = context.injector.get<IChildProcess>("childProcess");
	const $liveSyncCommandHelper = context.injector.get<ILiveSyncCommandHelper>(
		"liveSyncCommandHelper",
	);
	const $logger = context.injector.get<ILogger>("logger");

	$liveSyncCommandHelper.validatePlatform(platform);
	const $projectData = context.injector.get(ProjectData);
	const androidDir = `${$projectData.platformsDir}/android`;

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
			$logger.error(
				"Android Studio is not installed, or is not in a standard location. Use NATIVESCRIPT_ANDROID_STUDIO_PATH.",
			);
			return;
		}
	}

	const os = currentPlatform();
	if (os === "darwin") {
		$childProcess.execFile("open", ["-a", studioPath, androidDir]);
	} else if (os === "win32" || os === "linux") {
		const child = $childProcess.spawn(studioPath, [androidDir], {
			detached: true,
			stdio: "ignore",
		});
		child.on("error", (error: Error) => $logger.error(error.message));
		child.unref();
	}
}

async function openXcodeProject(
	context: CommandContext,
	platformDirName: string,
	isInteractive: boolean,
): Promise<void> {
	const $childProcess = context.injector.get<IChildProcess>("childProcess");
	const $iOSProjectService =
		context.injector.get<IOSProjectService>("iOSProjectService");
	const $logger = context.injector.get<ILogger>("logger");
	const $xcodeSelectService =
		context.injector.get<IXcodeSelectService>("xcodeSelectService");
	const $xcodebuildArgsService = context.injector.get<IXcodebuildArgsService>(
		"xcodebuildArgsService",
	);

	const os = currentPlatform();
	if (os !== "darwin") {
		$logger.error("Opening a project in XCode requires macOS.");
		return;
	}

	const $projectData = context.injector.get(ProjectData);
	const platformDir = path.resolve($projectData.platformsDir, platformDirName);

	if (!fs.existsSync(platformDir)) {
		const prepareCommand = injector.resolveCommand("prepare") as ICommand;

		await prepareCommand.execute([platformDirName]);
		if (isInteractive) {
			process.stdin.resume();
		}
	}
	const platformData = $iOSProjectService.getPlatformData($projectData);
	const xcprojectFile = $xcodebuildArgsService.getXcodeProjectArgs(
		platformData,
		$projectData,
	)[1];

	if (fs.existsSync(xcprojectFile)) {
		$xcodeSelectService
			.getDeveloperDirectoryPath()
			.then(() => $childProcess.execFile("open", [xcprojectFile]))
			.catch((e) => {
				$logger.error(e.message);
			});
	} else {
		$logger.error(`Unable to open project file: ${xcprojectFile}`);
	}
}

async function openVisionOSProject(
	context: CommandContext,
	$options: IOptions,
	isInteractive: boolean,
): Promise<void> {
	$options.platformOverride = "visionOS";
	try {
		await openXcodeProject(context, "visionos", isInteractive);
	} finally {
		$options.platformOverride = null;
	}
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
	params: "none",
	providers: [provideProject()],
	async run(context): Promise<void> {
		const $options = inject<IOptions>("options");
		await withoutWatch($options, () => openXcodeProject(context, "ios", false));
	},
});

export const visionOpenCommand = defineCommand({
	name: ["open|visionos", "open|vision"],
	description: "Opens the visionOS project in Xcode.",
	options: openCommandOptions,
	params: "none",
	providers: [provideProject()],
	async run(context): Promise<void> {
		const $options = inject<IOptions>("options");
		await withoutWatch($options, () =>
			openVisionOSProject(context, $options, false),
		);
	},
});

export const androidOpenCommand = defineCommand({
	name: "open|android",
	description: "Opens the project in Android Studio.",
	options: openCommandOptions,
	params: "none",
	providers: [provideProject()],
	async run(context): Promise<void> {
		const $options = inject<IOptions>("options");
		await withoutWatch($options, () =>
			openAndroidStudioProject(context, "Android", false),
		);
	},
});
