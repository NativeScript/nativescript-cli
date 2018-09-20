import * as path from "path";
import * as shell from "shelljs";
const osenv = require("osenv");
import * as constants from "../../../constants";

export class IOSLiveSyncService implements IDeviceLiveSyncService {
	private get $project(): any {
		return this.$injector.resolve("project");
	}

	constructor(private _device: Mobile.IDevice,
		private $fs: IFileSystem,
		private $injector: IInjector,
		private $logger: ILogger,
		private $errors: IErrors,
		private $options: ICommonOptions,
		private $iosDeviceOperations: IIOSDeviceOperations) {
		// If we execute livesync with --watch we do not want to dispose the $iosDeviceOperations.
		this.$iosDeviceOperations.setShouldDispose(!this.$options.watch);
	}

	private get device(): Mobile.IDevice {
		return this._device;
	}

	public async refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		if (this.device.isEmulator) {
			const simulatorLogFilePath = path.join(osenv.home(), `/Library/Developer/CoreSimulator/Devices/${this.device.deviceInfo.identifier}/data/Library/Logs/system.log`);
			const simulatorLogFileContent = this.$fs.readText(simulatorLogFilePath) || "";

			const simulatorCachePath = path.join(osenv.home(), `/Library/Developer/CoreSimulator/Devices/${this.device.deviceInfo.identifier}/data/Containers/Data/Application/`);
			const regex = new RegExp(`^(?:.*?)${deviceAppData.appIdentifier}(?:.*?)${simulatorCachePath}(.*?)$`, "gm");

			let guid = "";
			while (true) {
				const parsed = regex.exec(simulatorLogFileContent);
				if (!parsed) {
					break;
				}

				guid = parsed[1];
			}

			if (!guid) {
				this.$errors.failWithoutHelp(`Unable to find application GUID for application ${deviceAppData.appIdentifier}. Make sure application is installed on Simulator.`);
			}

			const sourcePath = await deviceAppData.getDeviceProjectRootPath();
			const destinationPath = path.join(simulatorCachePath, guid, constants.LiveSyncConstants.IOS_PROJECT_PATH);

			this.$logger.trace(`Transferring from ${sourcePath} to ${destinationPath}`);
			shell.cp("-Rf", path.join(sourcePath, "*"), destinationPath);

			await this.device.applicationManager.restartApplication({ appId: deviceAppData.appIdentifier, projectName: "" });
		} else {
			await this.device.fileSystem.deleteFile("/Documents/AppBuilder/ServerInfo.plist", deviceAppData.appIdentifier);
			const notification = this.$project.projectData.Framework === constants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript ? "com.telerik.app.refreshApp" : "com.telerik.app.refreshWebView";
			const notificationData = {
				deviceId: this.device.deviceInfo.identifier,
				notificationName: notification,
				commandType: constants.IOS_POST_NOTIFICATION_COMMAND_TYPE
			};
			await this.$iosDeviceOperations.postNotification([notificationData]);
		}
	}

	public async removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		const devicePaths = localToDevicePaths.map(localToDevicePath => localToDevicePath.getDevicePath());

		for (const deviceFilePath of devicePaths) {
			await this.device.fileSystem.deleteFile(deviceFilePath, appIdentifier);
		}
	}
}

$injector.register("iosLiveSyncServiceLocator", { factory: IOSLiveSyncService });
