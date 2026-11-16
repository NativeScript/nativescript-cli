import { assert } from "chai";
import { IOSMacDeviceDiscovery } from "../../../mobile/mobile-core/ios-mac-device-discovery";
import {
	iOSRuntimeCanRunOnMac,
	isIOSMacDevice,
} from "../../../mobile/ios/mac/ios-mac-constants";
import { Yok } from "../../../yok";
import { DeviceDiscoveryEventNames } from "../../../constants";
import { DevicePlatformsConstants } from "../../../mobile/device-platforms-constants";
import {
	CommonLoggerStub,
	ErrorsStub,
	HooksServiceStub,
	LockServiceStub,
} from "../stubs";
import { FileSystemStub } from "../../../../../test/stubs";
import { IInjector } from "../../../definitions/yok";

const provisioningUDID = "00006031-0012716E2262001C";

function createTestInjector(opts: {
	arm64?: boolean;
	isDarwin?: boolean;
	device?: string;
}): IInjector {
	const injector = new Yok();
	injector.register("injector", injector);
	injector.register("fs", FileSystemStub);
	injector.register("plistParser", {});
	injector.register("errors", ErrorsStub);
	injector.register("logger", CommonLoggerStub);
	injector.register("hooksService", HooksServiceStub);
	injector.register("lockService", LockServiceStub);
	injector.register("iOSDebuggerPortService", {});
	injector.register("iOSNotification", {});
	injector.register("deviceLogProvider", {});
	injector.register("platformsDataService", {});
	injector.register("projectDataService", {});
	injector.register("devicePlatformsConstants", DevicePlatformsConstants);
	injector.register("hostInfo", { isDarwin: opts.isDarwin ?? true });
	injector.register("options", { device: opts.device });
	injector.register("mobileHelper", {
		isiOSPlatform: (platform: string) => platform.toLowerCase() === "ios",
	});
	injector.register("childProcess", {
		exec: async (command: string) => {
			if (command.startsWith("sysctl")) {
				return opts.arm64 === false ? "0\n" : "1\n";
			}
			if (command.startsWith("system_profiler")) {
				return JSON.stringify({
					SPHardwareDataType: [
						{ provisioning_UDID: provisioningUDID, machine_model: "Mac15,8" },
					],
				});
			}
			return "26.6.2\n";
		},
	});
	injector.register("iOSMacDeviceDiscovery", IOSMacDeviceDiscovery);
	return injector;
}

async function discover(
	injector: IInjector,
	options: Partial<Mobile.IDeviceLookingOptions>,
): Promise<Mobile.IDevice[]> {
	const discovery = injector.resolve<IOSMacDeviceDiscovery>(
		"iOSMacDeviceDiscovery",
	);
	const found: Mobile.IDevice[] = [];
	discovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (d: Mobile.IDevice) =>
		found.push(d),
	);
	await discovery.startLookingForDevices(<Mobile.IDeviceLookingOptions>options);
	return found;
}

describe("iOSMacDeviceDiscovery", () => {
	it("lists the Mac for `ns devices`", async () => {
		const [device] = await discover(createTestInjector({}), {
			platform: "ios",
			fullDiscovery: true,
		});

		assert.isOk(device);
		assert.isTrue(isIOSMacDevice(device));
		assert.equal(device.deviceInfo.identifier, provisioningUDID);
		assert.equal(device.deviceInfo.platform, "iOS");
	});

	it("adds the Mac when --device is mac or its UDID", async () => {
		for (const deviceOption of ["mac", provisioningUDID]) {
			const found = await discover(
				createTestInjector({ device: deviceOption }),
				{ platform: "ios" },
			);
			assert.lengthOf(found, 1, deviceOption);
		}
	});

	it("leaves the Mac out of a run that doesn't name it", async () => {
		const found = await discover(createTestInjector({}), { platform: "ios" });
		assert.lengthOf(found, 0);
	});

	it("skips Intel Macs, other hosts, other platforms and --emulator", async () => {
		const cases: [Parameters<typeof createTestInjector>[0], any][] = [
			[{ device: "mac", arm64: false }, { platform: "ios" }],
			[{ device: "mac", isDarwin: false }, { platform: "ios" }],
			[{ device: "mac" }, { platform: "android" }],
			[{ device: "mac" }, { platform: "ios", emulator: true }],
		];
		for (const [injectorOptions, lookingOptions] of cases) {
			const found = await discover(
				createTestInjector(injectorOptions),
				lookingOptions,
			);
			assert.lengthOf(found, 0, JSON.stringify([injectorOptions, lookingOptions]));
		}
	});
});

describe("iOSRuntimeCanRunOnMac", () => {
	it("accepts releases from 9.1.1 and next builds from NativeScript/ios#551 on", () => {
		assert.isTrue(iOSRuntimeCanRunOnMac("9.1.1"));
		assert.isTrue(iOSRuntimeCanRunOnMac("9.2.0"));
		assert.isTrue(iOSRuntimeCanRunOnMac("9.1.0-next.2026-11-11-43080423883"));
		assert.isTrue(iOSRuntimeCanRunOnMac("9.1.0-next.2026-11-12-43100000000"));
	});

	it("rejects 9.1.0 and next builds before NativeScript/ios#551", () => {
		assert.isFalse(iOSRuntimeCanRunOnMac("9.1.0"));
		assert.isFalse(iOSRuntimeCanRunOnMac("8.9.2"));
		assert.isFalse(iOSRuntimeCanRunOnMac("9.1.0-next.2026-11-11-43075498690"));
		assert.isFalse(iOSRuntimeCanRunOnMac("9.1.0-next.2026-11-10-42915841411"));
	});

	it("doesn't warn about versions it can't parse", () => {
		assert.isTrue(iOSRuntimeCanRunOnMac("file:../ios"));
		assert.isTrue(iOSRuntimeCanRunOnMac(undefined));
	});
});
