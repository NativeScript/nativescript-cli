///<reference path="../.d.ts"/>
"use strict";

import androidLiveSyncServiceLib = require("../common/mobile/android/android-livesync-service");
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
		private $injector: IInjector,
		$dispatcher: IFutureDispatcher) {
			super($devicesServices, $mobileHelper, $localToDevicePathDataFactory, $logger, $options, $deviceAppDataFactory, $fs, $dispatcher); 
	}
	
	public liveSync(platform: string): IFuture<void> {
		return (() => {
			this.$options.justlaunch = true;
			
			let restartAppOnDeviceAction = (device: Mobile.IDevice, deviceAppData: Mobile.IDeviceAppData, localToDevicePaths?: Mobile.ILocalToDevicePathData[]): IFuture<void> => {
				let platformSpecificUsbLiveSyncService = this.resolveUsbLiveSyncService(platform || this.$devicesServices.platform, device);
				return platformSpecificUsbLiveSyncService.restartApplication(deviceAppData, localToDevicePaths);
			}
			
			this.sync(platform, this.$projectData.projectId, this.$projectData.projectDir, path.join(this.$projectData.projectDir, "app"), this.excludedProjectDirsAndFiles, restartAppOnDeviceAction).wait();
		}).future<void>()();
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
				this.device.adb.executeShellCommand(`chmod 0777 ${path.join(deviceAppData.deviceProjectRootPath, "app")}`).wait();
				
				let commands: string[] = [];
				
				let devicePathRoot = `/data/data/${deviceAppData.appIdentifier}/files`;
				_.each(localToDevicePaths, localToDevicePath => {
					let devicePath = path.join(devicePathRoot, localToDevicePath.getRelativeToProjectBasePath());
					//commands.push(`ls "${path.dirname(devicePath)}" >/dev/null 2>/dev/null || mkdir "${path.dirname(devicePath)}"`);
					commands.push(`mv "${localToDevicePath.getDevicePath()}" "${devicePath}"`);
				});

				commands.push("exit");
				
				let commandsFileDevicePath = this.$mobileHelper.buildDevicePath(deviceAppData.deviceProjectRootPath, AndroidUsbLiveSyncService.LIVESYNC_COMMANDS_FILE_NAME);
				this.createCommandsFileOnDevice(commandsFileDevicePath, commands).wait();
				
				this.device.adb.executeShellCommand(`"cat ${commandsFileDevicePath} | run-as ${deviceAppData.appIdentifier}"`).wait();
			}
			
			this.device.applicationManager.restartApplication(deviceAppData.appIdentifier).wait();
		}).future<void>()();
	}
}
