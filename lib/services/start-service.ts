import { ChildProcess } from "child_process";
import { IChildProcess } from "../common/declarations";
import { injector } from "../common/yok";
import { IProjectData } from "../definitions/project";
import { IStartService } from "./../definitions/start-service.d";
import { IStaticConfig } from "../declarations";
import {
	findShortcut,
	IKeyShortcutService,
	KeyShortcut,
	keyShortcuts,
	NsKeyContext,
} from "./key-shortcuts";

export default class StartService implements IStartService {
	ios: ChildProcess;
	visionos: ChildProcess;
	android: ChildProcess;
	verbose: boolean = false;

	constructor(
		private $keyShortcutService: IKeyShortcutService,
		private $childProcess: IChildProcess,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $projectData: IProjectData,
		private $logger: ILogger,
		private $staticConfig: IStaticConfig,
	) {}

	toggleVerbose(): void {
		this.verbose = true;
		this.$logger.info(
			this.verbose ? `Verbose logging enabled` : `Verbose logging disabled`,
		);
	}

	format(data: Buffer, platform: string) {
		return data;
	}

	async runForPlatform(platform: string) {
		const platformLowerCase = platform.toLowerCase();
		const child = this.$childProcess.spawn(
			process.execPath,
			[this.$staticConfig.cliBinPath, "run", platformLowerCase],
			{
				cwd: this.$projectData.projectDir,
				stdio: ["ipc"],
				env: {
					FORCE_COLOR: 1,
					HIDE_HEADER: true,
					NS_IS_INTERACTIVE: true,
					...process.env,
				},
			},
		);
		(this as any)[platformLowerCase] = child;

		child.stdout.on("data", (data: Buffer) => {
			process.stdout.write(this.format(data, platform));
		});

		child.stderr.on("data", (data: Buffer) => {
			process.stderr.write(this.format(data, platform));
		});

		child.on("exit", (code: number) => {
			if (code) {
				this.$logger.error(
					`Running the ${platform} app exited with code ${code}.`,
				);
			}
		});

		await new Promise<void>((resolve, reject) => {
			child.once("spawn", () => {
				child.on("error", (error: Error) => this.$logger.error(error.message));
				resolve();
			});
			child.once("error", reject);
		});
	}

	async runIOS(): Promise<void> {
		await this.runForPlatform(this.$devicePlatformsConstants.iOS);
	}

	async runVisionOS(): Promise<void> {
		await this.runForPlatform(this.$devicePlatformsConstants.visionOS);
	}

	async runAndroid(): Promise<void> {
		await this.runForPlatform(this.$devicePlatformsConstants.Android);
	}
	async stopIOS(): Promise<void> {
		if (this.ios) {
			this.ios.kill("SIGINT");
		}
	}
	async stopVisionOS(): Promise<void> {
		if (this.visionos) {
			this.visionos.kill("SIGINT");
		}
	}
	async stopAndroid(): Promise<void> {
		if (this.android) {
			this.android.kill("SIGINT");
		}
	}

	start() {
		const shortcuts = keyShortcuts();
		const attached = this.$keyShortcutService.attach({
			context: { processType: "start" },
			shortcuts: [...shortcuts, ...this.delegatedShortcuts(shortcuts)],
		});

		if (!attached) {
			this.$logger.info(
				"Key shortcuts need an interactive terminal. Set NS_KEY_SHORTCUTS=true to override, or run the platform commands directly.",
			);
			return;
		}

		this.$keyShortcutService.printHelp();
	}

	/**
	 * The live sync runs in the spawned `ns run` children, so these keys are
	 * handed to them rather than acted on here; `c` has to stop them first.
	 * Each keeps the help text of the entry it replaces.
	 */
	private delegatedShortcuts(
		shortcuts: KeyShortcut<NsKeyContext>[],
	): KeyShortcut<NsKeyContext>[] {
		const forward = (key: string): KeyShortcut<NsKeyContext> => ({
			...findShortcut(shortcuts, key),
			quiet: true,
			action: () => {
				this.ios?.send(key);
				this.android?.send(key);
				this.visionos?.send(key);
			},
		});

		return [
			forward("w"),
			forward("r"),
			forward("R"),
			forward("B"),
			{
				...findShortcut(shortcuts, "c"),
				quiet: true,
				action: async () => {
					await this.stopIOS();
					await this.stopAndroid();
					await this.stopVisionOS();

					const clean = this.$childProcess.spawn(process.execPath, [
						this.$staticConfig.cliBinPath,
						"clean",
					]);
					clean.on("error", (error: Error) =>
						this.$logger.error(error.message),
					);
					clean.stdout.on("data", (data: Buffer) => {
						process.stdout.write(data);
						if (
							data.toString().includes("Project successfully cleaned.") ||
							data.toString().includes("Project unsuccessfully cleaned.")
						) {
							clean.kill("SIGINT");
						}
					});
				},
			},
		];
	}
}

injector.register("startService", StartService);
