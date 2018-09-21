import { AndroidLiveSyncService } from "../../../mobile/android/android-livesync-service";
import * as path from "path";
import * as helpers from "../../../helpers";

export class AppBuilderAndroidLiveSyncService extends AndroidLiveSyncService implements IDeviceLiveSyncService {
	constructor(_device: Mobile.IAndroidDevice,
		$fs: IFileSystem,
		$mobileHelper: Mobile.IMobileHelper,
		private $options: ICommonOptions) {
		super(_device, $fs, $mobileHelper);
	}

	public async refreshApplication(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		const commands = [this.liveSyncCommands.SyncFilesCommand()];
		if (this.$options.watch || this.$options.file) {
			commands.push(this.liveSyncCommands.RefreshCurrentViewCommand());
		} else {
			commands.push(this.liveSyncCommands.ReloadStartViewCommand());
		}

		await this.livesync(deviceAppData.appIdentifier, await deviceAppData.getDeviceProjectRootPath(), commands);
	}

	public async removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		if (localToDevicePaths && localToDevicePaths.length) {
			const deviceProjectRootPath = localToDevicePaths[0].deviceProjectRootPath;
			const commands = _.map(localToDevicePaths, ldp => {

				const relativePath = path.relative(deviceProjectRootPath, ldp.getDevicePath()),
					unixPath = helpers.fromWindowsRelativePathToUnix(relativePath);

				return this.liveSyncCommands.DeleteFile(unixPath);
			});
			await this.livesync(appIdentifier, deviceProjectRootPath, commands);
		}
	}
}
$injector.register("androidLiveSyncServiceLocator", { factory: AppBuilderAndroidLiveSyncService });
