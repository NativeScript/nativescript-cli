import * as path from "path";

class Wp8EmulatorServices implements Mobile.IEmulatorPlatformService {
	private static WP8_LAUNCHER = "XapDeployCmd.exe";
	private static WP8_LAUNCHER_PATH = "Microsoft SDKs\\Windows Phone\\v8.0\\Tools\\XAP Deployment";

	private static get programFilesPath(): string {
		return (process.arch === "x64") ? process.env["PROGRAMFILES(X86)"] : process.env.ProgramFiles;
	}

	constructor(private $logger: ILogger,
		private $childProcess: IChildProcess) { }

	public async getEmulatorId(): Promise<string> {
		return "";
	}

	public async getRunningEmulator(image: string): Promise<Mobile.IDeviceInfo> {
		return null;
	}

	public async getRunningEmulatorImageIdentifier(emulatorId: string): Promise<string> {
		return null;
	}

	public async getRunningEmulatorIds(): Promise<string[]> {
		return [];
	}

	public async startEmulator(): Promise<Mobile.IStartEmulatorOutput> {
		return null;
	}

	public async runApplicationOnEmulator(app: string, emulatorOptions?: Mobile.IRunApplicationOnEmulatorOptions): Promise<void> {
		this.$logger.info("Starting Windows Phone Emulator");
		const emulatorStarter = this.getPathToEmulatorStarter();
		this.$childProcess.spawn(emulatorStarter, ["/installlaunch", app, "/targetdevice:xd"], { stdio: "ignore", detached: true }).unref();
	}

	public async getEmulatorImages(): Promise<Mobile.IEmulatorImagesOutput> {
		return { devices: [], errors: []};
	}

	public async getRunningEmulators(): Promise<Mobile.IDeviceInfo[]> {
		return [];
	}

	public async getRunningEmulatorName(): Promise<string> {
		return "";
	}

	private getPathToEmulatorStarter(): string {
		return path.join(Wp8EmulatorServices.programFilesPath, Wp8EmulatorServices.WP8_LAUNCHER_PATH, Wp8EmulatorServices.WP8_LAUNCHER);
	}
}

$injector.register("wp8EmulatorServices", Wp8EmulatorServices);
