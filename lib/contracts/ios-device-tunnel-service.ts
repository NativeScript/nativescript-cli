import { Contract } from "../common/di/contract";

/**
 * Holds the CoreDevice tunnel of a USB-connected iOS 17+ / visionOS device
 * so an app can reach the Vite dev server on the Mac over the cable, without
 * Wi-Fi or the Local Network prompt.
 */
@Contract({ name: "iOSDeviceTunnelService" })
export abstract class IOSDeviceTunnelService {
	/**
	 * Opens the device's CoreDevice tunnel and keeps it up until `close` or
	 * the CLI exits. Resolves the Mac's address on the tunnel, or null when
	 * the device has no usable USB tunnel. A tunnel gets a new address every
	 * time it is re-established.
	 */
	abstract open(device: Mobile.IDevice): Promise<string | null>;

	/**
	 * The Mac's tunnel address for the single device of `platform` that has
	 * an open tunnel, if any.
	 */
	abstract getHostAddress(platform: string): string | undefined;

	abstract close(deviceIdentifier: string): Promise<void>;
}
