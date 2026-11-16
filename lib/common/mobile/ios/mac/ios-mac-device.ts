import { ChildProcess } from "child_process";
import * as net from "net";
import * as path from "path";
import { IOSDeviceBase } from "../ios-device-base";
import { IOSMacApplicationManager } from "./ios-mac-application-manager";
import { IOSMacFileSystem } from "./ios-mac-file-system";
import * as constants from "../../../constants";
import * as helpers from "../../../helpers";
import { cache } from "../../../decorators";
import { BUILD_DIR, DeviceConnectionType } from "../../../../constants";
import { IiOSNotification } from "../../../../declarations";
import { IChildProcess, IErrors } from "../../../declarations";
import { IInjector } from "../../../definitions/yok";
import { IPlatformsDataService } from "../../../../definitions/platform";
import { IProjectDataService } from "../../../../definitions/project";
import {
	IOS_MAC_BUILD_DIR_NAME,
	IOS_MAC_DEVICE_ALIAS,
} from "./ios-mac-constants";

export interface IIOSMacHardware {
	provisioningUDID: string;
	model: string;
	osVersion: string;
}

/**
 * This Apple silicon Mac, running the iOS app as "Designed for iPad".
 *
 * The app is the signed iphoneos build, but it runs on this machine, so
 * deploy, sync, logs and the debugger all work locally the way they do for a
 * simulator; isEmulator is true for that reason.
 */
export class IOSMacDevice extends IOSDeviceBase {
	public applicationManager: IOSMacApplicationManager;
	public fileSystem: Mobile.IDeviceFileSystem;
	public deviceInfo: Mobile.IDeviceInfo;

	private logProcess: ChildProcess;

	constructor(
		hardware: IIOSMacHardware,
		private $childProcess: IChildProcess,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $deviceLogProvider: Mobile.IDeviceLogProvider,
		protected $errors: IErrors,
		protected $lockService: ILockService,
		private $injector: IInjector,
		protected $iOSDebuggerPortService: IIOSDebuggerPortService,
		private $iOSNotification: IiOSNotification,
		private $platformsDataService: IPlatformsDataService,
		private $projectDataService: IProjectDataService,
		protected $logger: ILogger,
	) {
		super();
		this.applicationManager = this.$injector.resolve(
			IOSMacApplicationManager,
			{ device: this },
		);
		this.fileSystem = this.$injector.resolve(IOSMacFileSystem);
		this.deviceInfo = {
			imageIdentifier: IOS_MAC_DEVICE_ALIAS,
			identifier: hardware.provisioningUDID,
			displayName: "My Mac (Designed for iPad)",
			model: hardware.model,
			version: hardware.osVersion,
			vendor: "Apple",
			platform: this.$devicePlatformsConstants.iOS,
			status: constants.CONNECTED_STATUS,
			errorHelp: null,
			isTablet: true,
			type: constants.DeviceTypes.Device,
			connectionTypes: [DeviceConnectionType.Local],
		};
	}

	public get isEmulator(): boolean {
		return true;
	}

	public get isOnlyWiFiConnected(): boolean {
		return false;
	}

	/**
	 * macOS only launches an iOS app from the layout it gives installed iPad
	 * apps: <Name>.app/Wrapper/<Name>.app plus a WrappedBundle symlink.
	 */
	public get wrapperPath(): string {
		const projectData = this.$projectDataService.getProjectData();
		const platformData = this.$platformsDataService.getPlatformData(
			this.$devicePlatformsConstants.iOS.toLowerCase(),
			projectData,
		);
		return path.join(
			platformData.projectRoot,
			BUILD_DIR,
			IOS_MAC_BUILD_DIR_NAME,
			`${projectData.projectName}.app`,
		);
	}

	public get applicationBundlePath(): string {
		return path.join(
			this.wrapperPath,
			"Wrapper",
			path.basename(this.wrapperPath),
		);
	}

	public get executableName(): string {
		return path.basename(this.wrapperPath, ".app");
	}

	@cache()
	public async openDeviceLogStream(
		options?: Mobile.IiOSLogStreamOptions,
	): Promise<void> {
		const predicate =
			options && options.hasOwnProperty("predicate")
				? options.predicate
				: constants.IOS_LOG_PREDICATE;
		const processPredicate = `process == "${this.executableName}"`;
		this.logProcess = this.$childProcess.spawn("/usr/bin/log", [
			"stream",
			"--style",
			"syslog",
			"--predicate",
			predicate ? `${processPredicate} AND ${predicate}` : processPredicate,
		]);

		const action = (data: Buffer | string) => {
			this.$deviceLogProvider.logData(
				data.toString(),
				this.$devicePlatformsConstants.iOS,
				this.deviceInfo.identifier,
			);
		};
		this.logProcess.stdout?.on("data", action);
		this.logProcess.stderr?.on("data", action);
		this.logProcess.once("error", (err) =>
			this.$logger.trace(`Unable to stream the Mac log: ${err.message}`),
		);
	}

	public dispose(): void {
		this.logProcess?.kill();
	}

	protected async getDebugSocketCore(appId: string): Promise<net.Socket> {
		const attachRequest = this.$iOSNotification.getAttachRequest(
			appId,
			this.deviceInfo.identifier,
		);
		const postAttachRequest = () =>
			this.$childProcess
				.spawnFromEvent("notifyutil", ["-p", attachRequest], "close")
				.catch((err) => this.$logger.trace(err));

		await postAttachRequest();
		// The app may not have registered for the notification yet.
		const retry = setInterval(postAttachRequest, 5e3);
		const port = await super
			.getDebuggerPort(appId)
			.finally(() => clearInterval(retry));

		try {
			return await helpers.connectEventuallyUntilTimeout(
				async () => net.connect(port, "127.0.0.1"),
				constants.SOCKET_CONNECTION_TIMEOUT_MS,
			);
		} catch (err) {
			this.$logger.warn(err);
		}
	}
}
