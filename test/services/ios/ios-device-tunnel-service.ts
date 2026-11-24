import { assert } from "chai";
import { EventEmitter } from "events";
import { Yok } from "../../../lib/common/yok";
import { IInjector } from "../../../lib/common/definitions/yok";
import { provide } from "../../../lib/common/di";
import { MobileHelper } from "../../../lib/common/mobile/mobile-helper";
import { DevicePlatformsConstants } from "../../../lib/common/mobile/device-platforms-constants";
import { DeviceConnectionType } from "../../../lib/constants";
import {
	ChildProcess,
	Errors,
	FileSystem,
	HostInfo,
	IOSDeviceTunnelService,
	Logger,
	TempService,
} from "../../../lib/contracts";
import { IOSDeviceTunnelServiceImpl } from "../../../lib/services/ios/ios-device-tunnel-service";
import { ErrorsStub, LoggerStub, TempServiceStub } from "../../stubs";

const UDID = "00008030-000408D42692802E";

class FakeHolder extends EventEmitter {
	public pid = 4242;
	public exitCode: number = null;
	public signalCode: string = null;
	public killed = false;

	public kill(): boolean {
		this.killed = true;
		this.signalCode = "SIGTERM";
		this.emit("exit", null, "SIGTERM");
		return true;
	}
}

function coreDevice(connectionProperties: object, udid = UDID) {
	return {
		identifier: "3E4C6519-03DF-5CEB-9EA3-E027A81E52FC",
		hardwareProperties: { udid, platform: "iOS", reality: "physical" },
		connectionProperties,
	};
}

const wiredDisconnected = {
	transportType: "wired",
	tunnelState: "disconnected",
};
const wiredConnected = {
	transportType: "wired",
	tunnelState: "connected",
	tunnelIPAddress: "fd6f:72e:8d34::1",
};

const macInterfaces = {
	lo0: [
		{
			address: "::1",
			netmask: "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
			family: "IPv6",
		},
	],
	en0: [
		{ address: "192.168.1.10", netmask: "255.255.255.0", family: "IPv4" },
		{
			address: "fe80::1c2b:3a4d:5e6f:7081",
			netmask: "ffff:ffff:ffff:ffff::",
			family: "IPv6",
		},
	],
	utun4: [
		{
			address: "fd58:5467:5f7b::2",
			netmask: "ffff:ffff:ffff:ffff::",
			family: "IPv6",
		},
	],
	utun6: [
		{
			address: "fe80::35c1:eb2f:dbab:733",
			netmask: "ffff:ffff:ffff:ffff::",
			family: "IPv6",
		},
		{
			address: "fd6f:72e:8d34::2",
			netmask: "ffff:ffff:ffff:ffff::",
			family: "IPv6",
		},
	],
};

function iPhone(
	overrides: Partial<Mobile.IDeviceInfo> = {},
	isEmulator = false,
) {
	return <Mobile.IDevice>(<unknown>{
		isEmulator,
		deviceInfo: {
			identifier: UDID,
			displayName: "iPhone",
			platform: "iOS",
			version: "26.0.1",
			connectionTypes: [DeviceConnectionType.USB],
			...overrides,
		},
	});
}

describe("IOSDeviceTunnelService", () => {
	let devicectlListings: object[][];
	let listCalls: number;
	let spawned: { args: string[]; holder: FakeHolder }[];
	let warnings: string[];
	let isDarwin: boolean;
	let service: IOSDeviceTunnelServiceImpl;

	beforeEach(() => {
		devicectlListings = [];
		listCalls = 0;
		spawned = [];
		warnings = [];
		isDarwin = true;
		let lastListing: object[] = [];

		const injector: IInjector = new Yok();
		injector.register({
			provide: ChildProcess,
			useValue: {
				trySpawnFromCloseEvent: async () => {
					listCalls++;
					if (devicectlListings.length) {
						lastListing = devicectlListings.shift();
					}
					return { exitCode: lastListing ? 0 : 1 };
				},
				spawn: (command: string, args: string[]) => {
					const holder = new FakeHolder();
					spawned.push({ args: [command, ...args], holder });
					return holder;
				},
			},
		});
		injector.register("cleanupService", {
			addKillProcess: async () => ({}),
			removeKillProcess: async () => ({}),
		});
		injector.register({
			provide: FileSystem,
			useValue: {
				exists: () => true,
				readJson: () => ({ result: { devices: lastListing } }),
			},
		});
		injector.register({
			provide: HostInfo,
			useValue: {
				get isDarwin() {
					return isDarwin;
				},
			},
		});
		const logger = new LoggerStub();
		logger.warn = (message: string) => {
			warnings.push(message);
		};
		injector.register([
			{ provide: Logger, useValue: logger },
			{ provide: Errors, useClass: ErrorsStub },
		]);
		injector.register("devicePlatformsConstants", DevicePlatformsConstants);
		injector.register("mobileHelper", MobileHelper);
		injector.register([
			{ provide: TempService, useClass: TempServiceStub },
			provide(IOSDeviceTunnelService, IOSDeviceTunnelServiceImpl),
		]);

		service = <IOSDeviceTunnelServiceImpl>injector.get(IOSDeviceTunnelService);
		(<any>service).tunnelReadyTimeoutMs = 200;
		(<any>service).tunnelPollIntervalMs = 1;
		(<any>service).getNetworkInterfaces = () => macInterfaces;
	});

	it("holds the tunnel and resolves the Mac's address on it", async () => {
		devicectlListings = [
			[coreDevice(wiredDisconnected)],
			[coreDevice({ ...wiredConnected, tunnelState: "connecting" })],
			[coreDevice(wiredConnected)],
		];

		const address = await service.open(iPhone());

		assert.equal(address, "fd6f:72e:8d34::2");
		assert.equal(service.getHostAddress("ios"), "fd6f:72e:8d34::2");
		assert.lengthOf(spawned, 1);
		assert.includeMembers(spawned[0].args, [
			"xcrun",
			"devicectl",
			"notification",
			"observe",
			UDID,
		]);
		assert.isFalse(spawned[0].holder.killed);
	});

	it("opens one tunnel per device however often it is asked", async () => {
		devicectlListings = [[coreDevice(wiredConnected)]];

		const [first, second] = await Promise.all([
			service.open(iPhone()),
			service.open(iPhone()),
		]);

		assert.equal(first, "fd6f:72e:8d34::2");
		assert.equal(second, first);
		assert.lengthOf(spawned, 1);
	});

	const ineligible: {
		name: string;
		device: Mobile.IDevice;
		darwin?: boolean;
	}[] = [
		{ name: "a simulator", device: iPhone({}, true) },
		{
			name: "a Wi-Fi-only device",
			device: iPhone({ connectionTypes: [DeviceConnectionType.Wifi] }),
		},
		{ name: "a device on iOS 16", device: iPhone({ version: "16.7.10" }) },
		{ name: "a device on a non-macOS host", device: iPhone(), darwin: false },
	];
	for (const testCase of ineligible) {
		it(`does not ask devicectl about ${testCase.name}`, async () => {
			isDarwin = testCase.darwin ?? true;

			assert.isNull(await service.open(testCase.device));
			assert.equal(listCalls, 0);
			assert.lengthOf(spawned, 0);
		});
	}

	it("does not hold a tunnel for a network-paired device", async () => {
		devicectlListings = [
			[coreDevice({ ...wiredConnected, transportType: "localNetwork" })],
		];

		assert.isNull(await service.open(iPhone()));
		assert.lengthOf(spawned, 0);
	});

	it("falls back when devicectl is unavailable", async () => {
		devicectlListings = [null];

		assert.isNull(await service.open(iPhone()));
		assert.lengthOf(spawned, 0);
	});

	it("falls back when devicectl does not know the device", async () => {
		devicectlListings = [
			[coreDevice(wiredConnected, "00008112-000128D1022A201E")],
		];

		assert.isNull(await service.open(iPhone()));
		assert.lengthOf(spawned, 0);
	});

	it("releases the holder when the tunnel never comes up", async () => {
		devicectlListings = [[coreDevice(wiredDisconnected)]];

		assert.isNull(await service.open(iPhone()));
		assert.lengthOf(spawned, 1);
		assert.isTrue(spawned[0].holder.killed);
		assert.isUndefined(service.getHostAddress("ios"));
	});

	it("releases the holder when no Mac interface is on the tunnel", async () => {
		devicectlListings = [
			[coreDevice({ ...wiredConnected, tunnelIPAddress: "fd11:2233:4455::1" })],
		];

		assert.isNull(await service.open(iPhone()));
		assert.isTrue(spawned[0].holder.killed);
	});

	it("releases the holder and the host on close", async () => {
		devicectlListings = [[coreDevice(wiredConnected)]];
		await service.open(iPhone());

		await service.close(UDID);

		assert.isTrue(spawned[0].holder.killed);
		assert.isUndefined(service.getHostAddress("ios"));
		assert.isEmpty(warnings);
	});

	it("warns when the tunnel closes on its own", async () => {
		devicectlListings = [[coreDevice(wiredConnected)]];
		await service.open(iPhone());

		spawned[0].holder.emit("exit", 1, null);
		await new Promise((resolve) => setImmediate(resolve));

		assert.lengthOf(warnings, 1);
		assert.include(warnings[0], "fd6f:72e:8d34::2");
	});
});
