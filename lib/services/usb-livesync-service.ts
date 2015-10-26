///<reference path="../.d.ts"/>
"use strict";

import * as androidLiveSyncServiceLib from "../common/mobile/android/android-livesync-service";
import * as constants from "../constants";
import * as usbLivesyncServiceBaseLib from "../common/services/usb-livesync-service-base";
import * as path from "path";
import * as semver from "semver";
import * as net from "net";
import Future = require("fibers/future");

export class UsbLiveSyncService extends usbLivesyncServiceBaseLib.UsbLiveSyncServiceBase implements IUsbLiveSyncService {

	private excludedProjectDirsAndFiles = [
		"**/*.ts",
	];

	private fastLivesyncFileExtensions = [".css", ".xml"];

	constructor($devicesServices: Mobile.IDevicesServices,
		$fs: IFileSystem,
		$mobileHelper: Mobile.IMobileHelper,
		$localToDevicePathDataFactory: Mobile.ILocalToDevicePathDataFactory,
		$options: IOptions,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		$deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		$logger: ILogger,
		$injector: IInjector,
		private $platformService: IPlatformService,
		$dispatcher: IFutureDispatcher,
		$childProcess: IChildProcess,
		$iOSEmulatorServices: Mobile.IiOSSimulatorService,
		$hooksService: IHooksService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $projectDataService: IProjectDataService,
		private $prompter: IPrompter,
		$hostInfo: IHostInfo) {
			super($devicesService, $mobileHelper, $localToDevicePathDataFactory, $logger, $options,
				$deviceAppDataFactory, $fs, $dispatcher, $injector, $childProcess, $iOSEmulatorServices,
				$hooksService, $hostInfo);
	}

	public liveSync(platform: string): IFuture<void> {
		return (() => {
			platform = platform || this.initialize(platform).wait();
			let platformLowerCase = platform ? platform.toLowerCase() : null;
			let platformData = this.$platformsData.getPlatformData(platformLowerCase);

			if (platformLowerCase === this.$devicePlatformsConstants.Android.toLowerCase()) {
				this.$projectDataService.initialize(this.$projectData.projectDir);
				let frameworkVersion = this.$projectDataService.getValue(platformData.frameworkPackageName).wait().version;
				if (semver.lt(frameworkVersion, "1.2.1")) {
					let shouldUpdate = this.$prompter.confirm(
						"You need Android Runtime 1.2.1 or later for LiveSync to work properly. Do you want to update your runtime now?"
					).wait();
					if(shouldUpdate) {
						this.$platformService.updatePlatforms([this.$devicePlatformsConstants.Android.toLowerCase()]).wait();
					} else {
						return;
					}
				}
			}

			this.$platformService.preparePlatform(platform).wait();

			let projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

			let notInstalledAppOnDeviceAction = (device: Mobile.IDevice): IFuture<boolean> => {
				return (() => {
					this.$platformService.deployOnDevice(platform).wait();
					return false;
				}).future<boolean>()();
			};

			let notRunningiOSSimulatorAction = (): IFuture<boolean> => {
				return (() => {
					 this.$platformService.deployOnEmulator(this.$devicePlatformsConstants.iOS.toLowerCase()).wait();
					 return false;
				}).future<boolean>()();
			};

			let beforeLiveSyncAction = (device: Mobile.IDevice, deviceAppData: Mobile.IDeviceAppData): IFuture<void> => {
				let platformSpecificUsbLiveSyncService = this.resolveUsbLiveSyncService(platform || this.$devicesService.platform, device);
				if (platformSpecificUsbLiveSyncService.beforeLiveSyncAction) {
					return platformSpecificUsbLiveSyncService.beforeLiveSyncAction(deviceAppData);
				}
				return Future.fromResult();
			};

			let beforeBatchLiveSyncAction = (filePath: string): IFuture<string> => {
				return (() => {
					let projectFileInfo = this.getProjectFileInfo(filePath);
					let mappedFilePath = path.join(projectFilesPath, path.relative(path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME), projectFileInfo.onDeviceName));

					// Handle files that are in App_Resources/<platform>
					let appResourcesDirectoryPath = path.join(constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME);
					let platformSpecificAppResourcesDirectoryPath = path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName);
					if(filePath.indexOf(appResourcesDirectoryPath) > -1 && filePath.indexOf(platformSpecificAppResourcesDirectoryPath) === -1) {
						this.$logger.warn(`Unable to sync ${filePath}.`);
						return null;
					}
					if(filePath.indexOf(platformSpecificAppResourcesDirectoryPath) > -1) {
						let appResourcesRelativePath = path.relative(path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME,
							platformData.normalizedPlatformName), filePath);
						mappedFilePath = path.join(platformData.platformProjectService.getAppResourcesDestinationDirectoryPath().wait(), appResourcesRelativePath);
					}

					this.sendPageReloadMessage(path.extname(mappedFilePath), platform).wait();

					return mappedFilePath;
				}).future<string>()();
			};

			let iOSSimulatorRelativeToProjectBasePathAction = (projectFile: string): string => {
				return path.join(constants.APP_FOLDER_NAME, path.dirname(projectFile.split(`/${constants.APP_FOLDER_NAME}/`)[1]));
			};

			let shouldRestartApplication = (localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<boolean> => {
				return (() => {
					return false;
				}).future<boolean>()();
			};

			let watchGlob = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);

			let platformSpecificLiveSyncServices: IDictionary<any> = {
				android: AndroidUsbLiveSyncService,
				ios: IOSUsbLiveSyncService
			};

			let localProjectRootPath = platform.toLowerCase() === "ios" ? platformData.appDestinationDirectoryPath : null;

			this.sync(platform,
				this.$projectData.projectId,
				projectFilesPath,
				this.excludedProjectDirsAndFiles,
				watchGlob,
				platformSpecificLiveSyncServices,
				notInstalledAppOnDeviceAction,
				notRunningiOSSimulatorAction,
				localProjectRootPath,
				beforeLiveSyncAction,
				beforeBatchLiveSyncAction,
				iOSSimulatorRelativeToProjectBasePathAction,
				shouldRestartApplication
			).wait();
		}).future<void>()();
	}

	protected preparePlatformForSync(platform: string) {
		this.$platformService.preparePlatform(platform).wait();
	}

	private resolveUsbLiveSyncService(platform: string, device: Mobile.IDevice): IPlatformSpecificUsbLiveSyncService {
		let platformSpecificUsbLiveSyncService: IPlatformSpecificUsbLiveSyncService = null;
		if(platform.toLowerCase() === "android") {
			platformSpecificUsbLiveSyncService = this.$injector.resolve(AndroidUsbLiveSyncService, {_device: device});
		} else if(platform.toLowerCase() === "ios") {
			platformSpecificUsbLiveSyncService = this.$injector.resolve(IOSUsbLiveSyncService, {_device: device});
		}

		return platformSpecificUsbLiveSyncService;
	}

	private sendPageReloadMessage(fileExtension: string, platform: string): IFuture<void> {
		return (() => {
			if(_.contains(this.fastLivesyncFileExtensions, fileExtension)) {
				let platformLowerCase = platform ? platform.toLowerCase() : null;
				if(this.$options.emulator &&  platformLowerCase === "ios") {
					let platformSpecificUsbLiveSyncService = this.resolveUsbLiveSyncService(platform || this.$devicesServices.platform, null);
					platformSpecificUsbLiveSyncService.sendPageReloadMessageToSimulator().wait();
				} else {
					let devices = this.$devicesServices.getDevices();
					_.each(devices, (device: Mobile.IDevice) => {
						let platformSpecificUsbLiveSyncService = this.resolveUsbLiveSyncService(platform || this.$devicesServices.platform, device);
						return platformSpecificUsbLiveSyncService.sendPageReloadMessageToDevice();
					});
				}
			}
		}).future<void>()();
	}
}
$injector.register("usbLiveSyncService", UsbLiveSyncService);

export class IOSUsbLiveSyncService implements IPlatformSpecificUsbLiveSyncService {
	private static BACKEND_PORT = 18181;
	private currentPageReloadId = 0;

	constructor(private _device: Mobile.IDevice,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $iOSNotification: IiOSNotification,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService) { }

	private get device(): Mobile.IiOSDevice {
		return <Mobile.IiOSDevice>this._device;
	}

	public restartApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return this.device.applicationManager.restartApplication(deviceAppData.appIdentifier);
	}

	public sendPageReloadMessageToDevice(): IFuture<void> {
		return (() => {
			let timeout = 9000;
			this.$iOSSocketRequestExecutor.executeAttachRequest(this.device, timeout).wait();
			let socket = this.device.connectToPort(IOSUsbLiveSyncService.BACKEND_PORT);
			this.sendReloadMessageCore(socket);
		}).future<void>()();
	}

	public sendPageReloadMessageToSimulator(): IFuture<void> {
		return (() => {
			this.$iOSEmulatorServices.postDarwinNotification(this.$iOSNotification.attachRequest).wait();
			let socket = net.connect(IOSUsbLiveSyncService.BACKEND_PORT);
			this.sendReloadMessageCore(socket);
		}).future<void>()();
	}

	private sendReloadMessageCore(socket: net.Socket): void {
		let message = `{ "method":"Page.reload","params":{"ignoreCache":false},"id":${++this.currentPageReloadId} }`;
		let length = Buffer.byteLength(message, "utf16le");
		let payload = new Buffer(length + 4);
		payload.writeInt32BE(length, 0);
		payload.write(message, 4, length, "utf16le");
		socket.write(payload);
	}
}
$injector.register("iosUsbLiveSyncServiceLocator", {factory: IOSUsbLiveSyncService});

export class AndroidUsbLiveSyncService extends androidLiveSyncServiceLib.AndroidLiveSyncService implements IPlatformSpecificUsbLiveSyncService {
	constructor(_device: Mobile.IDevice,
		$fs: IFileSystem,
		$mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions) {
		super(<Mobile.IAndroidDevice>_device, $fs, $mobileHelper);

	}

	public restartApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			this.device.adb.executeShellCommand(["chmod", "777", deviceAppData.deviceProjectRootPath]).wait();
			this.device.adb.executeShellCommand(["chmod", "777",  `/data/local/tmp/${deviceAppData.appIdentifier}`]).wait();

			if(this.$options.companion) {
				let commands = [ this.liveSyncCommands.SyncFilesCommand() ];
				this.livesync(deviceAppData.appIdentifier, deviceAppData.deviceProjectRootPath, commands).wait();
			} else {
				let devicePathRoot = `/data/data/${deviceAppData.appIdentifier}/files`;
				let devicePath = this.$mobileHelper.buildDevicePath(devicePathRoot, "code_cache", "secondary_dexes", "proxyThumb");
				this.device.adb.executeShellCommand(["rm", "-rf", devicePath]).wait();
			}

			this.device.applicationManager.restartApplication(deviceAppData.appIdentifier).wait();
		}).future<void>()();
	}

	public beforeLiveSyncAction(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			let deviceRootPath = `/data/local/tmp/${deviceAppData.appIdentifier}`;
			this.device.adb.executeShellCommand(["rm", "-rf", this.$mobileHelper.buildDevicePath(deviceRootPath, "fullsync")]).wait();
			this.device.adb.executeShellCommand(["rm", "-rf", this.$mobileHelper.buildDevicePath(deviceRootPath, "sync")]).wait();
			this.device.adb.executeShellCommand(["rm", "-rf", this.$mobileHelper.buildDevicePath(deviceRootPath, "removedsync")]).wait();
		}).future<void>()();
	}

	public sendPageReloadMessageToSimulator(): IFuture<void> {
		return Future.fromResult();
	}

	public sendPageReloadMessageToDevice(): IFuture<void> {
		return Future.fromResult();
	}
}
$injector.register("androidUsbLiveSyncServiceLocator", {factory: AndroidUsbLiveSyncService});
