///<reference path="../.d.ts"/>
"use strict";

import * as androidLiveSyncServiceLib from "../common/mobile/android/android-livesync-service";
import * as constants from "../constants";
import * as usbLivesyncServiceBaseLib from "../common/services/usb-livesync-service-base";
import * as path from "path";
import * as semver from "semver";
import * as net from "net";
import Future = require("fibers/future");
import * as helpers from "../common/helpers";

export class UsbLiveSyncService extends usbLivesyncServiceBaseLib.UsbLiveSyncServiceBase implements IUsbLiveSyncService {

	private excludedProjectDirsAndFiles = [
		"**/*.ts",
	];

	constructor($devicesService: Mobile.IDevicesService,
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

			this.$platformService.ensurePlatformInstalled(platform).wait();

			let platformData = this.$platformsData.getPlatformData(platformLowerCase);

			this.$projectDataService.initialize(this.$projectData.projectDir);
			let frameworkVersion = this.$projectDataService.getValue(platformData.frameworkPackageName).wait().version;

			if (platformLowerCase === this.$devicePlatformsConstants.Android.toLowerCase()) {
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

			let notInstalledAppOnDeviceAction = (device: Mobile.IDevice): IFuture<void> => this.$platformService.installOnDevice(platform);

			let notRunningiOSSimulatorAction = (): IFuture<void> => this.$platformService.deployOnEmulator(this.$devicePlatformsConstants.iOS.toLowerCase());

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

					return mappedFilePath;
				}).future<string>()();
			};

			let iOSSimulatorRelativeToProjectBasePathAction = (projectFile: string): string => {
				return path.join(constants.APP_FOLDER_NAME, path.dirname(projectFile.split(`/${constants.APP_FOLDER_NAME}/`)[1]));
			};

			let watchGlob = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);

			let platformSpecificLiveSyncServices: IDictionary<any> = {
				android: AndroidUsbLiveSyncService,
				ios: IOSUsbLiveSyncService
			};

			let localProjectRootPath = platform.toLowerCase() === "ios" ? platformData.appDestinationDirectoryPath : null;

			let fastLivesyncFileExtensions = [".css", ".xml"];

			let fastLiveSync = (filePath: string) => {
				this.$dispatcher.dispatch(() => {
					return (() => {
						this.$platformService.preparePlatform(platform).wait();
						let mappedFilePath = beforeBatchLiveSyncAction(filePath).wait();

						if (this.shouldSynciOSSimulator(platform).wait()) {
							this.$iOSEmulatorServices.transferFiles(this.$projectData.projectId, [filePath], iOSSimulatorRelativeToProjectBasePathAction).wait();

							let platformSpecificUsbLiveSyncService = <IiOSUsbLiveSyncService>this.resolvePlatformSpecificLiveSyncService(platform || this.$devicesService.platform, null, platformSpecificLiveSyncServices);
							platformSpecificUsbLiveSyncService.sendPageReloadMessageToSimulator().wait();
						} else {
							let deviceAppData =  this.$deviceAppDataFactory.create(this.$projectData.projectId, this.$mobileHelper.normalizePlatformName(platform));
							let localToDevicePaths = this.createLocalToDevicePaths(platform, this.$projectData.projectId, localProjectRootPath || projectFilesPath, [mappedFilePath]);

							let devices = this.$devicesService.getDeviceInstances();
							_.each(devices, (device: Mobile.IDevice) => {
								if (this.$fs.exists(filePath).wait()) {
									this.transferFiles(device, deviceAppData, localToDevicePaths, projectFilesPath, true).wait();
								}
								let platformSpecificUsbLiveSyncService = this.resolvePlatformSpecificLiveSyncService(platform || this.$devicesService.platform, device, platformSpecificLiveSyncServices);
								return platformSpecificUsbLiveSyncService.sendPageReloadMessageToDevice(deviceAppData).wait();
							});
						}

						this.$logger.info(`Successfully synced application ${this.$projectData.projectId}.`);
					}).future<void>()();
				});
			};

			let getApplicationPathForiOSSimulatorAction = (): IFuture<string> => {
				return (() => {
					return this.$platformService.getLatestApplicationPackageForEmulator(platformData).wait().packageName;
				}).future<string>()();
			};

			let liveSyncData = {
				platform: platform,
				appIdentifier: this.$projectData.projectId,
				projectFilesPath: projectFilesPath,
				excludedProjectDirsAndFiles: this.excludedProjectDirsAndFiles,
				watchGlob: watchGlob,
				platformSpecificLiveSyncServices: platformSpecificLiveSyncServices,
				notInstalledAppOnDeviceAction: notInstalledAppOnDeviceAction,
				notRunningiOSSimulatorAction: notRunningiOSSimulatorAction,
				getApplicationPathForiOSSimulatorAction: getApplicationPathForiOSSimulatorAction,
				localProjectRootPath: localProjectRootPath,
				beforeLiveSyncAction: beforeLiveSyncAction,
				beforeBatchLiveSyncAction: beforeBatchLiveSyncAction,
				iOSSimulatorRelativeToProjectBasePathAction: iOSSimulatorRelativeToProjectBasePathAction,
				canExecuteFastLiveSync: (filePath: string) => _.contains(fastLivesyncFileExtensions, path.extname(filePath)) && semver.gte(frameworkVersion, "1.5.0"),
				fastLiveSync: fastLiveSync
			};

			this.sync(liveSyncData).wait();
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
}
$injector.register("usbLiveSyncService", UsbLiveSyncService);

let currentPageReloadId = 0;

export class IOSUsbLiveSyncService implements IiOSUsbLiveSyncService {
	private static BACKEND_PORT = 18181;

	constructor(private _device: Mobile.IDevice,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $iOSNotification: IiOSNotification,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $injector: IInjector) { }

	private get device(): Mobile.IiOSDevice {
		return <Mobile.IiOSDevice>this._device;
	}

	public restartApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return this.device.applicationManager.restartApplication(deviceAppData.appIdentifier);
	}

	public sendPageReloadMessageToDevice(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			let timeout = 9000;
			this.$iOSSocketRequestExecutor.executeAttachRequest(this.device, timeout).wait();
			let socket = this.device.connectToPort(IOSUsbLiveSyncService.BACKEND_PORT);
			this.sendPageReloadMessage(socket);
		}).future<void>()();
	}

	public sendPageReloadMessageToSimulator(): IFuture<void> {
		helpers.connectEventually(() => net.connect(IOSUsbLiveSyncService.BACKEND_PORT), (socket: net.Socket) => this.sendPageReloadMessage(socket));
		return this.$iOSEmulatorServices.postDarwinNotification(this.$iOSNotification.attachRequest);
	}

	public removeFile(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			_.each(localToDevicePaths, localToDevicePathData => {
				this.device.fileSystem.deleteFile(localToDevicePathData.getDevicePath(), appIdentifier);
			});
		}).future<void>()();
	}

	private sendPageReloadMessage(socket: net.Socket): void {
		try {
			this.sendPageReloadMessageCore(socket);
		} finally {
			socket.destroy();
		}
	}

	private sendPageReloadMessageCore(socket: net.Socket): void {
		let message = `{ "method":"Page.reload","params":{"ignoreCache":false},"id":${++currentPageReloadId} }`;
		let length = Buffer.byteLength(message, "utf16le");
		let payload = new Buffer(length + 4);
		payload.writeInt32BE(length, 0);
		payload.write(message, 4, length, "utf16le");
		socket.write(payload);
	}
}
$injector.register("iosUsbLiveSyncServiceLocator", {factory: IOSUsbLiveSyncService});

export class AndroidUsbLiveSyncService extends androidLiveSyncServiceLib.AndroidLiveSyncService implements IPlatformSpecificUsbLiveSyncService {
	private static BACKEND_PORT = 18181;

	constructor(_device: Mobile.IDevice,
		$fs: IFileSystem,
		$mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions) {
		super(<Mobile.IAndroidDevice>_device, $fs, $mobileHelper);
	}

	public restartApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			this.device.adb.executeShellCommand(["chmod", "777", deviceAppData.deviceProjectRootPath, `/data/local/tmp/${deviceAppData.appIdentifier}`]).wait();

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
			let deviceRootPath = this.getDeviceRootPath(deviceAppData.appIdentifier);
			this.device.adb.executeShellCommand(["rm", "-rf", this.$mobileHelper.buildDevicePath(deviceRootPath, "fullsync"),
				this.$mobileHelper.buildDevicePath(deviceRootPath, "sync"),
				this.$mobileHelper.buildDevicePath(deviceRootPath, "removedsync")]).wait();
		}).future<void>()();
	}

	public sendPageReloadMessageToDevice(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			this.device.adb.executeCommand(["forward", `tcp:${AndroidUsbLiveSyncService.BACKEND_PORT.toString()}`, `localabstract:${deviceAppData.appIdentifier}-livesync`]).wait();
			this.sendPageReloadMessage().wait();
		}).future<void>()();
	}

	public removeFile(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			let deviceRootPath = this.getDeviceRootPath(appIdentifier);
			_.each(localToDevicePaths, localToDevicePathData => {
				let relativeUnixPath = _.trimLeft(helpers.fromWindowsRelativePathToUnix(localToDevicePathData.getRelativeToProjectBasePath()), "/");
				let deviceFilePath = this.$mobileHelper.buildDevicePath(deviceRootPath, "removedsync", relativeUnixPath);
				this.device.adb.executeShellCommand(["mkdir", "-p", path.dirname(deviceFilePath), "&&", "touch", deviceFilePath]).wait();
			});
		}).future<void>()();
	}

	private getDeviceRootPath(appIdentifier: string): string {
		return `/data/local/tmp/${appIdentifier}`;
	}

	private sendPageReloadMessage(): IFuture<void> {
		let future = new Future<void>();

		let socket = new net.Socket();
		socket.connect(AndroidUsbLiveSyncService.BACKEND_PORT, '127.0.0.1', () => {
			try {
				socket.write(new Buffer([0, 0, 0, 1, 1]));
 				future.return();
			} catch(e) {
				future.throw(e);
			} finally {
				socket.destroy();
			}
		});

		return future;
	}
}
$injector.register("androidUsbLiveSyncServiceLocator", {factory: AndroidUsbLiveSyncService});
