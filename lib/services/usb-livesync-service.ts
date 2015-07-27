///<reference path="../.d.ts"/>
"use strict";

import androidLiveSyncServiceLib = require("../common/mobile/android/android-livesync-service");
import constants = require("../constants");
import helpers = require("../common/helpers");
import usbLivesyncServiceBaseLib = require("../common/services/usb-livesync-service-base");
import path = require("path");

export class UsbLiveSyncService extends usbLivesyncServiceBaseLib.UsbLiveSyncServiceBase implements IUsbLiveSyncService {
	private excludedProjectDirsAndFiles = [
		"app_resources"
	];
	
	constructor(private $commandsService: ICommandsService,
		$devicesServices: Mobile.IDevicesServices,
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
		$dispatcher: IFutureDispatcher) {
			super($devicesServices, $mobileHelper, $localToDevicePathDataFactory, $logger, $options, $deviceAppDataFactory, $fs, $dispatcher, $injector); 
	}
	
	public liveSync(platform: string): IFuture<void> {
		return (() => {
			platform = platform || this.initialize(platform).wait();
			this.$platformService.preparePlatform(platform).wait();
			
			let platformData = this.$platformsData.getPlatformData(platform.toLowerCase());			
			let projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			
			let canLiveSyncAction = (device: Mobile.IDevice, appIdentifier: string): IFuture<boolean> => {
				return (() => {
					if(platform.toLowerCase() === "android") {
						let output = (<Mobile.IAndroidDevice>device).adb.executeShellCommand(`"echo '' | run-as ${appIdentifier}"`).wait();
						if(output.indexOf(`run-as: Package '${appIdentifier}' is unknown`) !== -1) {
							this.$logger.warn(`Unable to livesync on device ${device.deviceInfo.identifier}. Consider upgrading your device OS.`);
							return false;
						}
					}
					
					return true;
				}).future<boolean>()();
			}
			
			let notInstalledAppOnDeviceAction = (device: Mobile.IDevice): IFuture<void> => {
				return this.$platformService.deployOnDevice(platform);
			}
			
			let beforeBatchLiveSyncAction = (filePath: string): IFuture<string> => {
				return (() => {
					this.$platformService.preparePlatform(platform).wait();
					return path.join(projectFilesPath, path.relative(path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME), filePath));
				}).future<string>()();
			}
			
			let watchGlob = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME) + "/**/*";
			let platformSpecificLiveSyncServices: IDictionary<any> = {
				android: AndroidUsbLiveSyncService,
				ios: IOSUsbLiveSyncService
			};
			this.sync(platform, this.$projectData.projectId, platformData.appDestinationDirectoryPath, projectFilesPath, this.excludedProjectDirsAndFiles, watchGlob, platformSpecificLiveSyncServices, notInstalledAppOnDeviceAction, beforeBatchLiveSyncAction, canLiveSyncAction).wait();
		}).future<void>()();
	}
}
$injector.register("usbLiveSyncService", UsbLiveSyncService);

export class IOSUsbLiveSyncService implements IPlatformSpecificUsbLiveSyncService {
	constructor(private _device: Mobile.IDevice) { }
	
	private get device(): Mobile.IiOSDevice {
		return <Mobile.IiOSDevice>this._device;
	}
	
	public restartApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return this.device.applicationManager.restartApplication(deviceAppData.appIdentifier);
	} 
}

export class AndroidUsbLiveSyncService extends androidLiveSyncServiceLib.AndroidLiveSyncService implements IPlatformSpecificUsbLiveSyncService {
	private static LIVESYNC_COMMANDS_FILE_NAME = "nativescript.livesync.commands.sh";
	
	constructor(_device: Mobile.IDevice,
		$fs: IFileSystem,
		$mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions) {
		super(<Mobile.IAndroidDevice>_device, $fs, $mobileHelper);
		
	}
	
	public restartApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			if(this.$options.companion) {
				let commands = [ this.liveSyncCommands.SyncFilesCommand() ];			
				this.livesync(deviceAppData.appIdentifier, deviceAppData.deviceProjectRootPath, commands).wait();
			} else {
				this.device.adb.executeShellCommand(`chmod 0777 ${this.$mobileHelper.buildDevicePath(deviceAppData.deviceProjectRootPath, "app")}`).wait();
				
				let commands: string[] = [];
				
				let devicePathRoot = `/data/data/${deviceAppData.appIdentifier}/files`;
				_.each(localToDevicePaths, localToDevicePath => {
					let devicePath = this.$mobileHelper.correctDevicePath(path.join(devicePathRoot, localToDevicePath.getRelativeToProjectBasePath()));
					if(this.$fs.getFsStats(localToDevicePath.getLocalPath()).wait().isFile()) {
						commands.push(`mv "${localToDevicePath.getDevicePath()}" "${devicePath}"`);
					}
				});
				
				commands.push(`rm -rf ${this.$mobileHelper.buildDevicePath(devicePathRoot, "code_cache", "secondary_dexes", "proxyThumb")}`);
				commands.push("exit");
				
				let commandsFileDevicePath = this.$mobileHelper.buildDevicePath(deviceAppData.deviceProjectRootPath, AndroidUsbLiveSyncService.LIVESYNC_COMMANDS_FILE_NAME);
				this.createCommandsFileOnDevice(commandsFileDevicePath, commands).wait();
				
				let result = this.device.adb.executeShellCommand(`"cat ${commandsFileDevicePath} | run-as ${deviceAppData.appIdentifier}"`).wait();
				if(result.indexOf("Permission denied") !== -1) {
					this.device.adb.executeShellCommand(`${commandsFileDevicePath}`).wait();
				}
			}
			
			this.device.applicationManager.restartApplication(deviceAppData.appIdentifier).wait();
		}).future<void>()();
	}
}
