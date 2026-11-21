import * as os from "os";
import * as semver from "semver";
import {
	IChildProcess,
	IDictionary,
	IFileSystem,
	IHostInfo,
} from "../../common/declarations";
import { injector } from "../../common/yok";
import { IOSDeviceTunnelService } from "../../contracts/ios-device-tunnel-service";
import { ICleanupService } from "../../definitions/cleanup-service";
import { ITempService } from "../../definitions/temp-service";
import { DeviceConnectionType } from "../../constants";
import type * as child_process from "child_process";

/** Long enough to outlive any dev session; devicectl's default is 300 s. */
const HOLD_SECONDS = 365 * 24 * 60 * 60;

interface ICoreDeviceConnection {
	transportType?: string;
	tunnelState?: string;
	tunnelIPAddress?: string;
}

interface ITunnel {
	platform: string;
	holder?: child_process.ChildProcess;
	address: Promise<string | null>;
	closed: boolean;
}

export class IOSDeviceTunnelServiceImpl implements IOSDeviceTunnelService {
	private tunnels: IDictionary<ITunnel> = {};
	private hostAddresses: IDictionary<string> = {};
	private tunnelReadyTimeoutMs = 10000;
	private tunnelPollIntervalMs = 500;

	constructor(
		private $childProcess: IChildProcess,
		private $cleanupService: ICleanupService,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $tempService: ITempService,
	) {}

	public open(device: Mobile.IDevice): Promise<string | null> {
		const id = device.deviceInfo.identifier;
		if (!this.tunnels[id]) {
			const tunnel: ITunnel = {
				platform: device.deviceInfo.platform.toLowerCase(),
				address: null,
				closed: false,
			};
			this.tunnels[id] = tunnel;
			tunnel.address = this.openCore(device, tunnel).catch((err): null => {
				this.$logger.trace(`Unable to open the USB tunnel to ${id}: ${err}`);
				this.stopHolder(tunnel);
				return null;
			});
		}
		return this.tunnels[id].address;
	}

	public getHostAddress(platform: string): string | undefined {
		return this.hostAddresses[platform.toLowerCase()];
	}

	public async close(deviceIdentifier: string): Promise<void> {
		const tunnel = this.tunnels[deviceIdentifier];
		if (!tunnel) {
			return;
		}
		delete this.tunnels[deviceIdentifier];
		tunnel.closed = true;
		const address = await tunnel.address;
		if (address && this.hostAddresses[tunnel.platform] === address) {
			delete this.hostAddresses[tunnel.platform];
		}
		this.stopHolder(tunnel);
	}

	private async openCore(
		device: Mobile.IDevice,
		tunnel: ITunnel,
	): Promise<string | null> {
		const id = device.deviceInfo.identifier;
		const ineligible = this.getIneligibilityReason(device);
		if (ineligible) {
			this.$logger.trace(`Not using a USB tunnel for ${id}: ${ineligible}.`);
			return null;
		}

		const jsonPath = await this.$tempService.path({
			prefix: "ns-devicectl-",
			suffix: ".json",
		});
		const connection = await this.getConnection(id, jsonPath);
		if (connection?.transportType !== "wired") {
			this.$logger.trace(
				`Not using a USB tunnel for ${id}: devicectl reports ${connection ? `transport ${connection.transportType}` : "no such device"}.`,
			);
			return null;
		}

		tunnel.holder = this.startHolder(id, tunnel);
		const deviceAddress = await this.waitForTunnel(id, jsonPath, tunnel);
		const hostAddress =
			deviceAddress && this.findLocalTunnelAddress(deviceAddress);
		if (!hostAddress) {
			this.$logger.trace(
				`Not using a USB tunnel for ${id}: ${deviceAddress ? `no local address on the tunnel to ${deviceAddress}` : "the tunnel did not come up"}.`,
			);
			this.stopHolder(tunnel);
			return null;
		}
		if (tunnel.closed) {
			return null;
		}

		this.hostAddresses[tunnel.platform] = hostAddress;
		this.$logger.info(
			`Using the USB tunnel to ${device.deviceInfo.displayName} (Mac address ${hostAddress}) for the Vite dev server.`,
		);
		return hostAddress;
	}

	private getIneligibilityReason(device: Mobile.IDevice): string | null {
		const { deviceInfo } = device;
		if (!this.$hostInfo.isDarwin) {
			return "not on macOS";
		}
		if (device.isEmulator) {
			return "it is a simulator";
		}
		if (!deviceInfo.connectionTypes?.includes(DeviceConnectionType.USB)) {
			return "it is not connected over USB";
		}
		const version = semver.coerce(deviceInfo.version);
		if (
			this.$mobileHelper.isiOSPlatform(deviceInfo.platform) &&
			(!version || semver.major(version) < 17)
		) {
			return `iOS ${deviceInfo.version} has no CoreDevice tunnel`;
		}
		return null;
	}

	private async getConnection(
		deviceIdentifier: string,
		jsonPath: string,
	): Promise<ICoreDeviceConnection | null> {
		const result = await this.$childProcess.trySpawnFromCloseEvent("xcrun", [
			"devicectl",
			"list",
			"devices",
			"--quiet",
			"--json-output",
			jsonPath,
		]);
		if (result.exitCode !== 0 || !this.$fs.exists(jsonPath)) {
			return null;
		}
		const devices: any[] = this.$fs.readJson(jsonPath)?.result?.devices || [];
		const match = devices.find(
			(d) => d?.hardwareProperties?.udid === deviceIdentifier,
		);
		return match ? match.connectionProperties || {} : null;
	}

	private startHolder(
		deviceIdentifier: string,
		tunnel: ITunnel,
	): child_process.ChildProcess {
		const holder = this.$childProcess.spawn(
			"xcrun",
			[
				"devicectl",
				"device",
				"notification",
				"observe",
				"--device",
				deviceIdentifier,
				"--name",
				"org.nativescript.cli.usb-tunnel",
				"--session-timeout",
				String(HOLD_SECONDS),
				"--timeout",
				String(HOLD_SECONDS + 60),
				"--quiet",
			],
			{ stdio: "ignore" },
		);
		holder.on("error", (err: Error) =>
			this.$logger.trace(`USB tunnel holder for ${deviceIdentifier}: ${err}`),
		);
		holder.once("exit", () => {
			if (holder.pid) {
				this.$cleanupService.removeKillProcess(holder.pid.toString());
			}
			if (tunnel.closed || tunnel.holder !== holder) {
				return;
			}
			tunnel.holder = undefined;
			tunnel.address.then((address) => {
				if (address && !tunnel.closed) {
					this.$logger.warn(
						`The USB tunnel to ${deviceIdentifier} closed, so the app can no longer reach the Vite dev server at ${address}. Restart the run to reconnect.`,
					);
				}
			});
		});
		if (holder.pid) {
			this.$cleanupService.addKillProcess(holder.pid.toString());
		}
		return holder;
	}

	private async waitForTunnel(
		deviceIdentifier: string,
		jsonPath: string,
		tunnel: ITunnel,
	): Promise<string | null> {
		const deadline = Date.now() + this.tunnelReadyTimeoutMs;
		while (tunnel.holder && !tunnel.closed && Date.now() < deadline) {
			const connection = await this.getConnection(deviceIdentifier, jsonPath);
			if (
				connection?.tunnelState === "connected" &&
				connection.tunnelIPAddress
			) {
				return connection.tunnelIPAddress;
			}
			await new Promise((resolve) =>
				setTimeout(resolve, this.tunnelPollIntervalMs),
			);
		}
		return null;
	}

	/**
	 * devicectl reports the device's end of the tunnel; the Mac's end is the
	 * local interface address in the same subnet.
	 */
	private findLocalTunnelAddress(deviceAddress: string): string | null {
		const device = parseIPv6(deviceAddress);
		if (!device) {
			return null;
		}
		for (const entries of Object.values(this.getNetworkInterfaces())) {
			for (const entry of entries || []) {
				const local = parseIPv6(entry.address);
				const mask = parseIPv6(entry.netmask);
				if (
					!local ||
					!mask ||
					entry.address.includes("%") ||
					local.every((group, i) => group === device[i])
				) {
					continue;
				}
				if (
					local.every((group, i) => (group & mask[i]) === (device[i] & mask[i]))
				) {
					return entry.address;
				}
			}
		}
		return null;
	}

	protected getNetworkInterfaces(): NodeJS.Dict<os.NetworkInterfaceInfo[]> {
		return os.networkInterfaces();
	}

	private stopHolder(tunnel: ITunnel): void {
		const holder = tunnel.holder;
		tunnel.holder = undefined;
		if (holder && holder.exitCode === null && holder.signalCode === null) {
			holder.kill();
		}
	}
}

/** The eight 16-bit groups of an IPv6 address, or null for anything else. */
function parseIPv6(address: string): number[] | null {
	if (!address || !address.includes(":") || address.includes(".")) {
		return null;
	}
	const [head, tail, ...rest] = address.split("%")[0].split("::");
	if (rest.length) {
		return null;
	}
	const toGroups = (part: string) =>
		part ? part.split(":").map((g) => parseInt(g, 16)) : [];
	const left = toGroups(head);
	const right = toGroups(tail);
	const missing = 8 - left.length - right.length;
	if (tail === undefined ? missing !== 0 : missing < 1) {
		return null;
	}
	const groups = [
		...left,
		...new Array(Math.max(missing, 0)).fill(0),
		...right,
	];
	return groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff)
		? groups
		: null;
}

injector.register("iOSDeviceTunnelService", IOSDeviceTunnelServiceImpl);
