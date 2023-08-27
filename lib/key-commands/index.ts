import * as fs from "fs";
import { platform as currentPlatform } from "os";
import * as path from "path";
import { color } from "../color";
import { PrepareCommand } from "../commands/prepare";
import { IChildProcess } from "../common/declarations";
import { ICommand } from "../common/definitions/commands";
import {
	IKeyCommand,
	IKeyCommandPlatform,
	IValidKeyCommands,
	SupportedProcessType,
} from "../common/definitions/key-commands";
import { injector } from "../common/yok";
import { IProjectData } from "../definitions/project";
import { IStartService } from "../definitions/start-service";

export class A implements IKeyCommand {
	key: IValidKeyCommands = "a";
	platform: IKeyCommandPlatform = "Android";
	description: string = "Run android app";

	constructor(private $startService: IStartService) {}

	async execute(): Promise<void> {
		this.$startService.runAndroid();
	}

	canExecute(processType: SupportedProcessType) {
		return processType === "start";
	}
}

export class ShiftA implements IKeyCommand {
	key: IValidKeyCommands = "A";
	platform: IKeyCommandPlatform = "Android";
	description: string = "Open android project in Android Studio";
	willBlockKeyCommandExecution: boolean = true;

	constructor(
		private $logger: ILogger,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper,
		private $childProcess: IChildProcess,
		private $projectData: IProjectData
	) {}

	async execute(): Promise<void> {
		this.$liveSyncCommandHelper.validatePlatform(this.platform);
		this.$projectData.initializeProjectData();
		const androidDir = `${this.$projectData.platformsDir}/android`;

		if (!fs.existsSync(androidDir)) {
			const prepareCommand = injector.resolveCommand(
				"prepare"
			) as PrepareCommand;
			await prepareCommand.execute([this.platform]);
			process.stdin.resume();
		}

		const os = currentPlatform();

		if (os === "darwin") {
			if (!fs.existsSync("/Applications/Android Studio.app")) {
				this.$logger.error("Android Studio is not installed");
				return;
			}
			this.$childProcess.exec(
				`open -a "/Applications/Android Studio.app" ${androidDir}`
			);
		} else if (os === "win32") {
			const studioPath = path.join(
				"C:",
				"Program Files",
				"Android",
				"Android Studio",
				"bin",
				"studio64.exe"
			);
			if (!fs.existsSync(studioPath)) {
				this.$logger.error("Android Studio is not installed");
				return;
			}

			this.$childProcess.exec(`${studioPath} ${androidDir}`);
		} else if (os === "linux") {
			if (!fs.existsSync(`/usr/local/android-studio/bin/studio.sh`)) {
				this.$logger.error("Android Studio is not installed");
				return;
			}
			this.$childProcess.exec(
				`/usr/local/android-studio/bin/studio.sh ${androidDir}`
			);
		}
	}
}

export class I implements IKeyCommand {
	key: IValidKeyCommands = "i";
	platform: IKeyCommandPlatform = "iOS";
	description: string = "Run iOS app";

	constructor(private $startService: IStartService) {}

	async execute(): Promise<void> {
		this.$startService.runIOS();
	}

	canExecute(processType: SupportedProcessType) {
		return processType === "start";
	}
}

export class ShiftI implements IKeyCommand {
	key: IValidKeyCommands = "I";
	platform: IKeyCommandPlatform = "iOS";
	description: string = "Open iOS project in Xcode";
	willBlockKeyCommandExecution: boolean = true;

	constructor(
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $projectData: IProjectData
	) {}

	async execute(): Promise<void> {
		this.$projectData.initializeProjectData();
		const iosDir = `${this.$projectData.platformsDir}/ios`;

		if (!fs.existsSync(iosDir)) {
			const prepareCommand = injector.resolveCommand(
				"prepare"
			) as PrepareCommand;
			await prepareCommand.execute(["ios"]);
			process.stdin.resume();
		}

		const os = currentPlatform();
		if (os === "darwin") {
			if (!fs.existsSync("/Applications/Xcode.app")) {
				this.$logger.error("Xcode is not installed");
				return;
			}
			this.$childProcess.exec(
				`open -a "/Applications/Android Studio.app" ${iosDir}`
			);
		}
	}
}

export class R implements IKeyCommand {
	key: IValidKeyCommands = "r";
	platform: IKeyCommandPlatform = "all";
	description: string = "Rebuild native app if needed and restart";
	willBlockKeyCommandExecution: boolean = true;

	constructor(private $liveSyncCommandHelper: ILiveSyncCommandHelper) {}

	async execute(platform: string): Promise<void> {
		const devices = await this.$liveSyncCommandHelper.getDeviceInstances(
			platform
		);

		await this.$liveSyncCommandHelper.executeLiveSyncOperation(
			devices,
			platform,
			{
				restartLiveSync: true,
			} as ILiveSyncCommandHelperAdditionalOptions
		);
	}
}

export class ShiftR implements IKeyCommand {
	key: IValidKeyCommands = "R";
	platform: IKeyCommandPlatform = "all";
	description: string = "Force rebuild native app and restart";
	willBlockKeyCommandExecution: boolean = true;

	constructor(private $liveSyncCommandHelper: ILiveSyncCommandHelper) {}

	async execute(platform: string): Promise<void> {
		const devices = await this.$liveSyncCommandHelper.getDeviceInstances(
			platform
		);
		await this.$liveSyncCommandHelper.executeLiveSyncOperation(
			devices,
			platform,
			{
				skipNativePrepare: false,
				forceRebuildNativeApp: true,
				restartLiveSync: true,
			} as ILiveSyncCommandHelperAdditionalOptions
		);
	}
}

export class CtrlC implements IKeyCommand {
	key: IValidKeyCommands = "\u0003" as IValidKeyCommands;
	platform: IKeyCommandPlatform = "all";
	description: string;
	willBlockKeyCommandExecution: boolean = false;

	async execute(): Promise<void> {
		process.exit();
	}
}

export class W implements IKeyCommand {
	key: IValidKeyCommands = "w";
	platform: IKeyCommandPlatform = "all";
	description: string = "Toggle file watcher";
	willBlockKeyCommandExecution: boolean = true;

	constructor(private $prepareController: IPrepareController) {}

	async execute(): Promise<void> {
		try {
			const paused = await this.$prepareController.toggleFileWatcher();
			process.stdout.write(
				paused
					? color.gray("Paused watching file changes... Press 'w' to resume.")
					: color.bgGreen("Resumed watching file changes")
			);
		} catch (e) {}
	}
}

export class C implements IKeyCommand {
	key: IValidKeyCommands = "c";
	platform: IKeyCommandPlatform = "all";
	description: string = "Clean project";
	willBlockKeyCommandExecution: boolean = true;

	constructor(
		private $childProcess: IChildProcess,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper
	) {}

	async execute(): Promise<void> {
		await this.$liveSyncCommandHelper.stop();

		const clean = this.$childProcess.spawn("ns", ["clean"]);
		clean.stdout.on("data", (data) => {
			process.stdout.write(data);
			if (
				data.toString().includes("Project successfully cleaned.") ||
				data.toString().includes("Project unsuccessfully cleaned.")
			) {
				clean.kill("SIGINT");
			}
		});
	}
}

export class N implements IKeyCommand {
	key: IValidKeyCommands = "n";
	platform: IKeyCommandPlatform = "all";
	description: string = "Install dependencies";
	willBlockKeyCommandExecution: boolean = true;

	async execute(platform: string): Promise<void> {
		const install = injector.resolveCommand("install") as ICommand;
		await install.execute([]);
		process.stdin.resume();
	}
}

injector.registerKeyCommand("a", A);
injector.registerKeyCommand("i", I);
injector.registerKeyCommand("A", ShiftA);
injector.registerKeyCommand("I", ShiftI);
injector.registerKeyCommand("r", R);
injector.registerKeyCommand("R", ShiftR);
injector.registerKeyCommand("w", W);
injector.registerKeyCommand("c", C);
injector.registerKeyCommand("A", ShiftA);
injector.registerKeyCommand("n", N);
injector.registerKeyCommand("\u0003" as any, CtrlC);
