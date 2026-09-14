import { color } from "../color";
import {
	getAndroidStudioPath,
	openAndroidStudioProject,
	openVisionOSProject,
	openXcodeProject,
} from "../commands/open";
import { IChildProcess, IXcodeSelectService } from "../common/declarations";
import { ICommand } from "../common/definitions/commands";
import {
	IKeyCommand,
	IKeyCommandHelper,
	IKeyCommandPlatform,
	IValidKeyName,
	SpecialKeys,
	SupportedProcessType,
} from "../common/definitions/key-commands";
import { injector } from "../common/yok";
import { IProjectData } from "../definitions/project";
import { IStartService } from "../definitions/start-service";
import { IOSProjectService } from "../services/ios-project-service";
import { IOptions } from "../declarations";

export class A implements IKeyCommand {
	key: IValidKeyName = "a";
	platform: IKeyCommandPlatform = "Android";
	description: string = "Run Android app";
	group = "Android";

	constructor(private $startService: IStartService) {}

	async execute(): Promise<void> {
		this.$startService.runAndroid();
	}

	canExecute(processType: SupportedProcessType) {
		return processType === "start";
	}
}

export class ShiftA implements IKeyCommand {
	key: IValidKeyName = "A";
	platform: IKeyCommandPlatform = "Android";
	description: string = "Open project in Android Studio";
	group = "Android";
	willBlockKeyCommandExecution: boolean = true;
	protected isInteractive: boolean = true;
	constructor(
		private $logger: ILogger,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper,
		private $childProcess: IChildProcess,
		private $projectData: IProjectData,
	) {}

	getAndroidStudioPath(): string | null {
		return getAndroidStudioPath();
	}

	async execute(): Promise<void> {
		await openAndroidStudioProject(
			{
				$logger: this.$logger,
				$liveSyncCommandHelper: this.$liveSyncCommandHelper,
				$childProcess: this.$childProcess,
				$projectData: this.$projectData,
			},
			this.platform,
			this.isInteractive,
		);
	}
}

export class I implements IKeyCommand {
	key: IValidKeyName = "i";
	platform: IKeyCommandPlatform = "iOS";
	description: string = "Run iOS app";
	group = "iOS";

	constructor(private $startService: IStartService) {}

	async execute(): Promise<void> {
		this.$startService.runIOS();
	}

	canExecute(processType: SupportedProcessType) {
		return processType === "start";
	}
}

export class ShiftI implements IKeyCommand {
	key: IValidKeyName = "I";
	platform: IKeyCommandPlatform = "iOS";
	description: string = "Open project in Xcode";
	group = "iOS";
	willBlockKeyCommandExecution: boolean = true;
	protected isInteractive: boolean = true;

	constructor(
		private $iOSProjectService: IOSProjectService,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $projectData: IProjectData,
		private $xcodeSelectService: IXcodeSelectService,
		private $xcodebuildArgsService: IXcodebuildArgsService,
	) {}

	async execute(): Promise<void> {
		await openXcodeProject(
			{
				$iOSProjectService: this.$iOSProjectService,
				$logger: this.$logger,
				$childProcess: this.$childProcess,
				$projectData: this.$projectData,
				$xcodeSelectService: this.$xcodeSelectService,
				$xcodebuildArgsService: this.$xcodebuildArgsService,
			},
			"ios",
			this.isInteractive,
		);
	}
}

export class V implements IKeyCommand {
	key: IValidKeyName = "v";
	platform: IKeyCommandPlatform = "visionOS";
	description: string = "Run visionOS app";
	group = "visionOS";

	constructor(private $startService: IStartService) {}

	async execute(): Promise<void> {
		this.$startService.runVisionOS();
	}

	canExecute(processType: SupportedProcessType) {
		return processType === "start";
	}
}

export class ShiftV implements IKeyCommand {
	key: IValidKeyName = "V";
	platform: IKeyCommandPlatform = "visionOS";
	description: string = "Open project in Xcode";
	group = "visionOS";
	willBlockKeyCommandExecution: boolean = true;
	protected isInteractive: boolean = true;

	constructor(
		private $iOSProjectService: IOSProjectService,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $projectData: IProjectData,
		private $xcodeSelectService: IXcodeSelectService,
		private $xcodebuildArgsService: IXcodebuildArgsService,
		protected $options: IOptions,
	) {}

	async execute(): Promise<void> {
		await openVisionOSProject(
			{
				$iOSProjectService: this.$iOSProjectService,
				$logger: this.$logger,
				$childProcess: this.$childProcess,
				$projectData: this.$projectData,
				$xcodeSelectService: this.$xcodeSelectService,
				$xcodebuildArgsService: this.$xcodebuildArgsService,
			},
			this.$options,
			this.isInteractive,
		);
	}
}

export class R implements IKeyCommand {
	key: IValidKeyName = "r";
	platform: IKeyCommandPlatform = "all";
	description: string = "Rebuild native app if needed and restart";
	group = "Development Workflow";
	willBlockKeyCommandExecution: boolean = true;

	constructor(private $liveSyncCommandHelper: ILiveSyncCommandHelper) {}

	async execute(platform: string): Promise<void> {
		const devices =
			await this.$liveSyncCommandHelper.getDeviceInstances(platform);

		await this.$liveSyncCommandHelper.executeLiveSyncOperation(
			devices,
			platform,
			{
				restartLiveSync: true,
			} as ILiveSyncCommandHelperAdditionalOptions,
		);
	}
}

export class ShiftR implements IKeyCommand {
	key: IValidKeyName = "R";
	platform: IKeyCommandPlatform = "all";
	description: string = "Force rebuild native app and restart";
	group = "Development Workflow";
	willBlockKeyCommandExecution: boolean = true;

	constructor(private $liveSyncCommandHelper: ILiveSyncCommandHelper) {}

	async execute(platform: string): Promise<void> {
		const devices =
			await this.$liveSyncCommandHelper.getDeviceInstances(platform);
		await this.$liveSyncCommandHelper.executeLiveSyncOperation(
			devices,
			platform,
			{
				skipNativePrepare: false,
				forceRebuildNativeApp: true,
				restartLiveSync: true,
			} as ILiveSyncCommandHelperAdditionalOptions,
		);
	}
}

export class CtrlC implements IKeyCommand {
	key: IValidKeyName = SpecialKeys.CtrlC;
	platform: IKeyCommandPlatform = "all";
	description: string;
	group = "Development Workflow";
	willBlockKeyCommandExecution: boolean = false;

	async execute(): Promise<void> {
		process.exit();
	}
}

export class W implements IKeyCommand {
	key: IValidKeyName = "w";
	platform: IKeyCommandPlatform = "all";
	description: string = "Toggle file watcher";
	group = "Development Workflow";
	willBlockKeyCommandExecution: boolean = true;

	constructor(private $prepareController: IPrepareController) {}

	async execute(): Promise<void> {
		try {
			const paused = await this.$prepareController.toggleFileWatcher();
			process.stdout.write(
				paused
					? color.gray("Paused watching file changes... Press 'w' to resume.")
					: color.bgGreen("Resumed watching file changes"),
			);
		} catch (e) {}
	}
}

export class C implements IKeyCommand {
	key: IValidKeyName = "c";
	platform: IKeyCommandPlatform = "all";
	description: string = "Clean project";
	group = "Development Workflow";
	willBlockKeyCommandExecution: boolean = true;

	constructor(
		private $childProcess: IChildProcess,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper,
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
	key: IValidKeyName = "n";
	platform: IKeyCommandPlatform = "all";
	description: string = "Install dependencies";
	group = "Development Workflow";
	willBlockKeyCommandExecution: boolean = true;

	async execute(platform: string): Promise<void> {
		const install = injector.resolveCommand("install") as ICommand;
		await install.execute([]);
		process.stdin.resume();
	}
}

export class QuestionMark implements IKeyCommand {
	key: IValidKeyName = SpecialKeys.QuestionMark;
	platform: IKeyCommandPlatform = "all";
	description: string = "Show this help";
	group = "Development Workflow";
	willBlockKeyCommandExecution: boolean = true;

	constructor(private $keyCommandHelper: IKeyCommandHelper) {}

	async execute(platform_: string): Promise<void> {
		let platform: IKeyCommandPlatform;
		switch (platform_.toLowerCase()) {
			case "android":
				platform = "Android";
				break;
			case "ios":
				platform = "iOS";
				break;
			case "visionOS":
			case "vision":
				platform = "visionOS";
				break;
			default:
				platform = "all";
				break;
		}
		this.$keyCommandHelper.printCommands(platform);
		process.stdin.resume();
	}
}

injector.registerKeyCommand("a", A);
injector.registerKeyCommand("A", ShiftA);
injector.registerKeyCommand("i", I);
injector.registerKeyCommand("I", ShiftI);
injector.registerKeyCommand("v", V);
injector.registerKeyCommand("V", ShiftV);
injector.registerKeyCommand("r", R);
injector.registerKeyCommand("R", ShiftR);
injector.registerKeyCommand("w", W);
injector.registerKeyCommand("c", C);
injector.registerKeyCommand("A", ShiftA);
injector.registerKeyCommand("n", N);
injector.registerKeyCommand(SpecialKeys.QuestionMark, QuestionMark);
injector.registerKeyCommand(SpecialKeys.CtrlC, CtrlC);
