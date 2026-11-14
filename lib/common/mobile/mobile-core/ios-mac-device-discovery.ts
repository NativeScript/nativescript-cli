import { DeviceDiscovery } from "./device-discovery";
import { IIOSMacHardware, IOSMacDevice } from "../ios/mac/ios-mac-device";
import { IOS_MAC_DEVICE_ALIAS } from "../ios/mac/ios-mac-constants";
import { IChildProcess, IHostInfo } from "../../declarations";
import { IInjector } from "../../definitions/yok";
import { IOptions } from "../../../declarations";
import { injector } from "../../yok";

/**
 * Offers this Apple silicon Mac as an iOS device ("My Mac (Designed for
 * iPad)"). It is listed by `ns devices` and used only when `--device` names
 * it, so a plain `ns run ios` never launches the app on the Mac as well.
 */
export class IOSMacDeviceDiscovery extends DeviceDiscovery {
	private hardware: IIOSMacHardware;
	private isDeviceAdded = false;

	constructor(
		private $childProcess: IChildProcess,
		private $hostInfo: IHostInfo,
		private $injector: IInjector,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions,
	) {
		super();
	}

	public async startLookingForDevices(
		options?: Mobile.IDeviceLookingOptions,
	): Promise<void> {
		if (this.isDeviceAdded || !this.$hostInfo.isDarwin) {
			return;
		}

		if (
			options?.platform &&
			!this.$mobileHelper.isiOSPlatform(options.platform)
		) {
			return;
		}

		if (options?.emulator) {
			return;
		}

		const hardware = await this.getHardware();
		if (!hardware) {
			return;
		}

		const requested = this.$options.device;
		const isRequested =
			requested === IOS_MAC_DEVICE_ALIAS ||
			requested === hardware.provisioningUDID;
		if (!options?.fullDiscovery && !isRequested) {
			return;
		}

		this.addDevice(this.$injector.resolve(IOSMacDevice, { hardware }));
		this.isDeviceAdded = true;
	}

	private async getHardware(): Promise<IIOSMacHardware> {
		if (this.hardware !== undefined) {
			return this.hardware;
		}

		this.hardware = null;
		try {
			// Intel Macs can't run iOS apps; Rosetta hides arm64 from process.arch.
			const arm64 = await this.$childProcess.exec("sysctl -n hw.optional.arm64");
			if (arm64.toString().trim() !== "1") {
				return this.hardware;
			}

			const profile = JSON.parse(
				(
					await this.$childProcess.exec(
						"system_profiler SPHardwareDataType -json",
					)
				).toString(),
			);
			const info = profile?.SPHardwareDataType?.[0];
			const osVersion = (
				await this.$childProcess.exec("sw_vers -productVersion")
			)
				.toString()
				.trim();
			if (info?.provisioning_UDID) {
				this.hardware = {
					provisioningUDID: info.provisioning_UDID,
					model: info.machine_model || "Mac",
					osVersion,
				};
			}
		} catch (err) {
			this.$logger.trace(`Unable to read this Mac's hardware info: ${err}`);
		}

		return this.hardware;
	}
}

injector.register("iOSMacDeviceDiscovery", IOSMacDeviceDiscovery);
