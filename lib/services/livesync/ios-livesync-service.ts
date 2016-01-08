///<reference path="../../.d.ts"/>
"use strict";

import liveSyncServiceBaseLib = require("./livesync-service-base");
import * as helpers from "../../common/helpers";
import * as net from "net";

let currentPageReloadId = 0;

class IOSLiveSyncService extends liveSyncServiceBaseLib.LiveSyncServiceBase<Mobile.IiOSDevice> implements IPlatformLiveSyncService {
	private static BACKEND_PORT = 18181;

	constructor(_device: Mobile.IDevice,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $iOSNotification: IiOSNotification,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $injector: IInjector) {
			super(_device);
		}

	public removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			_.each(localToDevicePaths, localToDevicePathData => this.device.fileSystem.deleteFile(localToDevicePathData.getDevicePath(), appIdentifier));
		}).future<void>()();
	}

	protected restartApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return this.device.applicationManager.restartApplication(deviceAppData.appIdentifier, deviceAppData.appIdentifier.split(".")[2]);
	}

	protected reloadPage(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			let timeout = 9000;
			if (this.device.isEmulator) {
				helpers.connectEventually(() => net.connect(IOSLiveSyncService.BACKEND_PORT), (socket: net.Socket) => this.sendPageReloadMessage(socket));
			 	this.$iOSEmulatorServices.postDarwinNotification(this.$iOSNotification.attachRequest).wait();
			} else {
				this.$iOSSocketRequestExecutor.executeAttachRequest(this.device, timeout).wait();
				let socket = this.device.connectToPort(IOSLiveSyncService.BACKEND_PORT);
				this.sendPageReloadMessage(socket);
			}
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
$injector.register("iosLiveSyncServiceLocator", {factory: IOSLiveSyncService});
