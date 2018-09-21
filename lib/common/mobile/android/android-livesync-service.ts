class LiveSyncCommands {
	public static DeployProjectCommand(liveSyncUrl: string): string {
		return `DeployProject ${liveSyncUrl} \r`;
	}

	public static ReloadStartViewCommand(): string {
		return "ReloadStartView \r";
	}

	public static SyncFilesCommand(): string {
		return "SyncFiles \r";
	}

	public static RefreshCurrentViewCommand(): string {
		return "RefreshCurrentView \r";
	}

	public static DeleteFile(relativePath: string): string {
		return `DeleteFile "${relativePath}" \r`;
	}
}

export class AndroidLiveSyncService implements Mobile.IAndroidLiveSyncService {
	private static COMMANDS_FILE = "telerik.livesync.commands";
	private static LIVESYNC_BROADCAST_NAME = "com.telerik.LiveSync";

	constructor(protected device: Mobile.IAndroidDevice,
		protected $fs: IFileSystem,
		protected $mobileHelper: Mobile.IMobileHelper) { }

	public get liveSyncCommands(): any {
		return LiveSyncCommands;
	}

	public async livesync(appIdentifier: string, liveSyncRoot: string, commands: string[]): Promise<void> {
		const commandsFileDevicePath = this.$mobileHelper.buildDevicePath(liveSyncRoot, AndroidLiveSyncService.COMMANDS_FILE);
		await this.createCommandsFileOnDevice(commandsFileDevicePath, commands);
		await this.device.adb.sendBroadcastToDevice(AndroidLiveSyncService.LIVESYNC_BROADCAST_NAME, { "app-id": appIdentifier });
	}

	public createCommandsFileOnDevice(commandsFileDevicePath: string, commands: string[]): Promise<void> {
		return this.device.fileSystem.createFileOnDevice(commandsFileDevicePath, commands.join("\n"));
	}
}
