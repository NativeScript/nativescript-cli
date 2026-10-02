import * as os from "os";
import * as path from "path";
import { MacCatalystApplicationManager } from "./mac-catalyst-application-manager";
import { MacCatalystFileSystem } from "./mac-catalyst-file-system";
import * as constants from "../../constants";
import { DeviceConnectionType } from "../../../constants";
import { IInjector } from "../../definitions/yok";
import { IOptions } from "../../../declarations";
import { IBuildDataService } from "../../../definitions/build";
import { IPlatformsDataService } from "../../../definitions/platform";
import { IProjectDataService } from "../../../definitions/project";

export const MAC_CATALYST_DEVICE_IDENTIFIER = "mac-catalyst";

/**
 * The Mac exposed as a device so build, deploy and LiveSync drive a Catalyst app.
 */
export class MacCatalystDevice implements Mobile.IMacCatalystDevice {
	public applicationManager: Mobile.IDeviceApplicationManager;
	public fileSystem: Mobile.IDeviceFileSystem;
	public deviceInfo: Mobile.IDeviceInfo;

	private _applicationBundlePath: string = null;

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $injector: IInjector,
		private $options: IOptions,
		private $buildDataService: IBuildDataService,
		private $platformsDataService: IPlatformsDataService,
		private $projectDataService: IProjectDataService,
	) {
		this.applicationManager = this.$injector.resolve(
			MacCatalystApplicationManager,
			{ device: this },
		);
		this.fileSystem = this.$injector.resolve(MacCatalystFileSystem);
		this.deviceInfo = {
			imageIdentifier: MAC_CATALYST_DEVICE_IDENTIFIER,
			identifier: MAC_CATALYST_DEVICE_IDENTIFIER,
			displayName: os.hostname(),
			model: "Mac",
			version: os.release(),
			vendor: "Apple",
			platform: this.$devicePlatformsConstants.Catalyst,
			status: constants.CONNECTED_STATUS,
			errorHelp: null,
			isTablet: false,
			type: constants.DeviceTypes.Device,
			connectionTypes: [DeviceConnectionType.Local],
		};
	}

	/**
	 * Path of the built .app, falling back to where the build would put it.
	 */
	public get applicationBundlePath(): string {
		if (!this._applicationBundlePath) {
			this._applicationBundlePath = this.getBuiltApplicationBundlePath();
		}

		return this._applicationBundlePath;
	}

	public set applicationBundlePath(bundlePath: string) {
		this._applicationBundlePath = bundlePath;
	}

	public get isEmulator(): boolean {
		return false;
	}

	public get isOnlyWiFiConnected(): boolean {
		return false;
	}

	public async openDeviceLogStream(): Promise<void> {
		// Nothing to attach to until the application manager launches the app.
		return;
	}

	private getBuiltApplicationBundlePath(): string {
		const projectData = this.$projectDataService.getProjectData();
		const platform = this.$devicePlatformsConstants.Catalyst;
		const platformData = this.$platformsDataService.getPlatformData(
			platform.toLowerCase(),
			projectData,
		);
		const buildData = this.$buildDataService.getBuildData(
			projectData.projectDir,
			platform,
			this.$options.argv,
		);

		return path.join(
			platformData.getBuildOutputPath(buildData),
			`${projectData.projectName}.app`,
		);
	}
}
