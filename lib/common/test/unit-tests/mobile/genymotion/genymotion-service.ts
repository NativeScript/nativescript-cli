
import { Yok } from "../../../../yok";
import { AndroidGenymotionService } from "../../../../mobile/android/genymotion/genymotion-service";
import { EmulatorHelper } from "../../../../mobile/emulator-helper";

import { assert } from "chai";
import { NOT_RUNNING_EMULATOR_STATUS, RUNNING_EMULATOR_STATUS, AndroidVirtualDevice } from '../../../../constants';
import { CommonLoggerStub } from "../../stubs";

const error = "some test error";
const enumerateGuestPropertiesOutput = `Name: hardware_opengl, value: 1, timestamp: 1519225339826058000, flags:
Name: vbox_graph_mode, value: 768x1280-16, timestamp: 1519225322816787000, flags:
Name: vbox_dpi, value: 320, timestamp: 1519225322854554000, flags:
Name: genymotion_force_navbar, value: 1, timestamp: 1519225322889883000, flags:
Name: product_device, value: vbox86p, timestamp: 1528097816574945000, flags:
Name: product_model, value: Google Nexus 4 - 5.0.0 - API 21 - 768x1280, timestamp: 1528097816660542000, flags:
Name: /VirtualBox/HostInfo/VBoxVerExt, value: 5.2.6, timestamp: 1530176155721789000, flags: TRANSIENT, RDONLYGUEST
Name: build_fingerprint, value: generic/vbox86p/vbox86p:5.0/LRX21M/genymotion09281726:userdebug/test-keys, timestamp: 1528097816635743000, flags:
Name: product_board, value: , timestamp: 1530176162030738000, flags:
Name: genymotion_vm_name, value: Google Nexus 4 - 5.0.0 - API 21 - 768x1280, timestamp: 1530176155369455000, flags:
Name: serialno, value: [ARGH]: [ARGH]
[androVM.vbox_dpi]: [320]
[androVM.vbox_graph_mode]: [768x1280-16]
[dalvik.vm.dex2oat-Xms]: [64m]
[dalvik.vm.dex2oat-Xmx]: [512m]
[dalvik.vm.heapgrowthlimit]: [96m]
[dalvik.vm.heapmaxfree]: [8m]
[dalvik.vm.heapminfree]: [512k]
[dalvik.vm.heapsize]: [256m]
[dalvik.vm.heapstartsize]: [8m]
[dalvik.vm.heaptargetutilization]: [0.75]
[dalvik.vm.image-dex2oat-Xms]: [64m]
[dalvik.vm.image-dex2oat-Xmx]: [64m]
[dalvik.vm.isa.x86.features]: [default]
[dalvik.vm.lockprof.threshold]: [500]
[dalvik.vm.stack-trace-file]: [/data/anr/traces.txt]
[genyd.device.id]: [000000000000000]
[init.svc.adbd]: [running]
[init.svc.debuggerd]: [running]
[init.svc.drm]: [running]
[init.svc.genybaseband]: [running]
[init.svc.genyd]: [running]
[init.svc.installd]: [running]
[init.svc.keystore]: [running]
[init.svc.media]: [running]
[init.svc.netd]: [running]
[init.svc.ril-daemon]: [running]
[init.svc.sdcard]: [running]
[init.svc.su_daemon]: [running]
[init.svc.ueventd]: [running]
[init.svc.vbox86-setup]: [running]
[init.svc.zygote]: [running]
[keyguard.no_require_sim]: [true]
[net.bt.name]: [Android]
[net.change]: [net.eth0.dns2]
[net.eth0.dns1]: []
[net.eth0.dns2]: []
[net.tcp.default_init_rwnd]: [60]
[persist.service.adb.enable]: [1]
[persist.sys.country]: [US]
[persist.sys.dalvik.vm.lib.2]: [libart.so]
[persist.sys.language]: [en]
[persist.sys.localevar]: []
[persist.sys.profiler_ms]: [0]
[persist.sys.timezone]: [America/New_York]
[persist.sys.usb.config]: [adb]
[qemu.hw.mainkeys]: [0]
[rild.libargs]: [-s/dev/socket/baseband_ril]
[rild.libpath]: [/system/lib/libreference-ril.so]
[ro.allow.mock.location]: [0]
[ro.baseband]: [unknown]
[ro.board.platform]: []
[ro.boot.console]: [tty0]
[ro.boot.hardware]: [vbox86]
[ro.bootloader]: [unknown]
[ro.bootmode]: [unknown]
[ro.bq.gpu_to_cpu_unsupported]: [1]
[ro.build.characteristics]: [default]
[ro.build.date.utc]: [1506619601]
[ro.build.date]: [Thu Sep 28 17:26:41 UTC 2017]
[ro.build.description]: [vbox86p-userdebug 5.0 LRX21M eng.genymotion.20170928.172507 test-keys]
[ro.build.display.id.geny-def]: [vbox86p-userdebug 5.0 LRX21M eng.genymotion.20170928.172507 test-keys]
[ro.build.display.id]: [vbox86p-userdebug 5.0 LRX21M eng.genymotion.20170928.172507 test-keys]
[ro.build.fingerprint.geny-def]: [generic/vbox86p/vbox86p:5.0/LRX21M/genymotion09281726:userdebug/test-keys]
[ro.build.host]: [8b54b5cea145]
[ro.build.id]: [LRX21M]
[ro.build.product]: [vbox86p]
[ro.build.shutdown_timeout]: [3]
[ro.build.tags.geny-def]: [test-keys]
[ro.build.type.geny-def]: [userdebug]
[ro.build.user]: [genymotion]
[ro.build.version.all_codenames]: [REL]
[ro.build.version.codename]: [REL]
[ro.build.version.incremental]: [eng.genymotion.20170928.172507]
[ro.build.version.release]: [5.0]
[ro.build.version.sdk]: [21]
[ro.carrier]: [unknown]
[ro.com.android.dataroaming]: [true]
[ro.com.android.dateformat]: [MM-dd-yyyy]
[ro.com.google.locationfeatures]: [1]
[ro.config.alarm_alert]: [Alarm_Classic.ogg]
[ro.config.notification_sound]: [pixiedust.ogg]
[ro.config.ringtone]: [Ring_Synth_04.ogg]
[ro.crypto.fuse_sdcard]: [true]
[ro.crypto.state]: [unencrypted]
[ro.dalvik.vm.native.bridge]: [0]
[ro.debuggable]: [1]
[ro.factorytest]: [0]
[ro.genyd.caps.acc]: [on]
[ro.genyd.caps.baseband]: [on]
[ro.genyd.caps.bat]: [on]
[ro.genyd.caps.cam]: [on]
[ro.genyd.caps.did]: [on]
[ro.genyd.caps.diskio]: [on]
[ro.genyd.caps.gps]: [on]
[ro.genyd.caps.net]: [on]
[ro.genyd.caps.rmt]: [on]
[ro.genyd.caps.scr]: [on]
[ro.genymotion.device.version]: [1]
[ro.genymotion.platform]: [p]
[ro.genymotion.player.version]: [1]
[ro.genymotion.version]: [2.11.0]
[ro.hardware]: [vbox86]
[ro.kernel.qemu.gles]: [1]
[ro.kernel.qemu]: [1]
[ro.lockscreen.disable.default]: [true]
[ro.manufacturer.geny-def]: [unknown]
[ro.opengles.version]: [131072]
[ro.product.board.geny-def]: []
[ro.product.board]: []
[ro.product.brand.geny-def]: [generic]
[ro.product.brand]: [generic]
[ro.product.cpu.abi]: [x86]
[ro.product.cpu.abilist32]: [x86]
[ro.product.cpu.abilist64]: []
[ro.product.cpu.abilist]: [x86]
[ro.product.device.geny-def]: [vbox86p]
[ro.product.device]: [vbox86p]
[ro.product.locale.language]: [en]
[ro.product.locale.region]: [US]
[ro.product.manufacturer]: [unknown]
[ro.product.model.geny-def]: [Genymotion 'Phone' version]
[ro.product.name.geny-def]: [vbox86p]
[ro.product.name]: [vbox86p]
[ro.radio.use-ppp]: [no]
[ro.revision]: [0]
[ro.ril.gprsclass]: [10]
[ro.ril.hsxpa]: [1]
[ro.secure]: [1]
[ro.sf.lcd_density]: [320]
[ro.wifi.channels]: []
[ro.zygote.disable_gl_preload]: [true]
[ro.zygote]: [zygote32]
[selinux.reload_policy]: [1]
[service.adb.root]: [1]
[sys.usb.config]: [adb]
[sys.usb.state]: [adb]
[wifi.interface.mac]: [08:00:27:de:7d:be]
[wifi.interface]: [eth1], timestamp: 1530176162048003000, flags:
Name: genymotion_player_version, value: 1, timestamp: 1530176155327396000, flags:
Name: genymotion_platform, value: p, timestamp: 1519225322998012000, flags:
Name: template_uuid, value: d39db595-6ae3-4ae9-bddc-fcaf85cf1d83, timestamp: 1519225322635760000, flags:
Name: /VirtualBox/HostGuest/SysprepExec, value: , timestamp: 1530176155721037000, flags: TRANSIENT, RDONLYGUEST
Name: genymotion_version, value: 2.11.0, timestamp: 1530176161984154000, flags:
Name: android_version, value: 5.0, timestamp: 1530176161980807000, flags:
Name: product_name, value: vbox86p, timestamp: 1528097816561734000, flags:
Name: build_display_id, value: vbox86p-userdebug 5.0 LRX21M eng.genymotion.20170928.172507 test-keys, timestamp: 1528097816608339000, flags:
Name: datadisk_size, value: 8192, timestamp: 1519225322672796000, flags:
Name: genymotion_device_id, value: 000000000000000, timestamp: 1519225323109489000, flags:
Name: androvm_ip_management, value: 192.168.56.101, timestamp: 1530176161924252000, flags:
Name: release_date, value: Thu Sep 28 17:22:12 2017 GMT, timestamp: 1519225322710195000, flags:
Name: build_tags, value: test-keys, timestamp: 1528097816648969000, flags:
Name: sensor_camera, value: 1, timestamp: 1519225322744320000, flags:
Name: hardware_opengl_disable_render, value: 0, timestamp: 1519225339861560000, flags:
Name: /VirtualBox/HostGuest/SysprepArgs, value: , timestamp: 1530176155721109000, flags: TRANSIENT, RDONLYGUEST
Name: build_type, value: userdebug, timestamp: 1528097816628214000, flags:
Name: product_brand, value: generic, timestamp: 1528097816596814000, flags:
Name: /VirtualBox/HostInfo/VBoxRev, value: 120293, timestamp: 1530176155721837000, flags: TRANSIENT, RDONLYGUEST
Name: /VirtualBox/HostInfo/VBoxVer, value: 5.2.6, timestamp: 1530176155721735000, flags: TRANSIENT, RDONLYGUEST
Name: sensor_gyro, value: 1, timestamp: 1519225322780126000, flags:
Name: genymotion_device_version, value: 1, timestamp: 1530176161954120000, flags:
Name: product_manufacturer, value: unknown, timestamp: 1528097816567956000, flags:`;
const vms = [{
	name: "Google Nexus 4 - 5.0.0 - API 21 - 768x1280",
	id: "9d9beef2-cc60-4a54-bcc0-cc1dbf89811f"
}, {
	name: "Custom Tablet - 6.0.0 - API 23 - 1536x2048",
	id: "da83e290-4d54-4b94-8654-540cf0c96604"
}, {
	name: "Custom Phone - 5.1.0 - API 22 - 768x1280",
	id: "94761c90-759f-4ae4-8eb3-8929a57a7ceb"
}, {
	name: "test",
	id: "4a1bf7cd-a7b4-45ef-8cb0-c5a0aafad211"
}];

function createTestInjector(): IInjector {
	const testInjector = new Yok();

	testInjector.register("androidGenymotionService", AndroidGenymotionService);
	testInjector.register("adb", {});
	testInjector.register("childProcess", { trySpawnFromCloseEvent: () => Promise.resolve({}) });
	testInjector.register("devicePlatformsConstants", { Android: "android" });
	testInjector.register("emulatorHelper", EmulatorHelper);
	testInjector.register("fs", {
		exists: () => true
	});
	testInjector.register("hostInfo", {});
	testInjector.register("logger", CommonLoggerStub);
	testInjector.register("virtualBoxService", {});

	return testInjector;
}

function getAvailableEmulatorData(data: { displayName: string, imageIdentifier: string, version: string, errorHelp?: string }): Mobile.IDeviceInfo {
	return {
		displayName: data.displayName,
		errorHelp: data.errorHelp || null,
		identifier: null,
		imageIdentifier: data.imageIdentifier,
		isTablet: false,
		model: data.displayName,
		platform: "android",
		status: NOT_RUNNING_EMULATOR_STATUS,
		type: "Emulator",
		vendor: "Genymotion",
		version: data.version
	};
}

function getRunningEmulatorData(data: { displayName: string, imageIdentifier: string, identifier: string, version: string }): Mobile.IDeviceInfo {
	return {
		identifier: data.identifier,
		imageIdentifier: data.imageIdentifier,
		displayName: data.displayName,
		model: data.displayName,
		version: data.version,
		vendor: 'Genymotion',
		status: RUNNING_EMULATOR_STATUS,
		errorHelp: null,
		isTablet: false,
		type: 'Device',
		platform: 'android'
	};
}

describe("GenymotionService", () => {
	let testInjector: IInjector = null;
	let androidGenymotionService: Mobile.IAndroidVirtualDeviceService = null;
	let adb: Mobile.IAndroidDebugBridge = null;
	let virtualBoxService: Mobile.IVirtualBoxService = null;

	beforeEach(() => {
		testInjector = createTestInjector();
		androidGenymotionService = testInjector.resolve("androidGenymotionService", AndroidGenymotionService);
		adb = testInjector.resolve("adb");
	});

	function mockAdbGetPropertyValue(deviceIds: string[], propName: string, propertyValue: string) {
		adb.getPropertyValue = (deviceId: string, propertyName: string) => {
			if (_.includes(deviceIds, deviceId) && propName === propertyName) {
				return Promise.resolve(propertyValue);
			}

			return Promise.resolve(null);
		};
	}

	function mockVirtualBoxService(output: Mobile.IVirtualBoxListVmsOutput, mapEnumerateGuestPropertiesOutput?: IDictionary<Mobile.IVirtualBoxEnumerateGuestPropertiesOutput>) {
		virtualBoxService = testInjector.resolve("virtualBoxService");
		virtualBoxService.listVms = () => Promise.resolve(output);
		if (mapEnumerateGuestPropertiesOutput) {
			virtualBoxService.enumerateGuestProperties = (id: string) => Promise.resolve(mapEnumerateGuestPropertiesOutput[id]);
		}
	}

	describe("getEmulatorImages", () => {
		it("should return [] when no emulators are available", async () => {
			mockVirtualBoxService({ vms: [], error: null });
			const result = await androidGenymotionService.getEmulatorImages([]);
			assert.lengthOf(result.devices, 0);
			assert.deepEqual(result.devices, []);
			assert.deepEqual(result.errors, []);
		});
		it("should return an empty array when an error is thrown", async () => {
			mockVirtualBoxService({ vms: [], error });
			const result = await androidGenymotionService.getEmulatorImages([]);
			assert.lengthOf(result.devices, 0);
			assert.deepEqual(result.devices, []);
			assert.deepEqual(result.errors, [error]);
		});
		it("should return all emulators when there are available emulators and no running emulators", async () => {
			const mapEnumerateGuestPropertiesOutput = {
				"9d9beef2-cc60-4a54-bcc0-cc1dbf89811f": { properties: enumerateGuestPropertiesOutput },
				"da83e290-4d54-4b94-8654-540cf0c96604": { properties: enumerateGuestPropertiesOutput },
				"94761c90-759f-4ae4-8eb3-8929a57a7ceb": { properties: enumerateGuestPropertiesOutput },
				"4a1bf7cd-a7b4-45ef-8cb0-c5a0aafad211": { properties: enumerateGuestPropertiesOutput }
			};

			mockVirtualBoxService({ vms, error: null }, mapEnumerateGuestPropertiesOutput);
			const result = await androidGenymotionService.getEmulatorImages([]);
			assert.lengthOf(result.devices, 4);
			assert.deepEqual(result.devices[0], getAvailableEmulatorData({ displayName: "Google Nexus 4 - 5.0.0 - API 21 - 768x1280", imageIdentifier: "9d9beef2-cc60-4a54-bcc0-cc1dbf89811f", version: "5.0" }));
			assert.deepEqual(result.devices[1], getAvailableEmulatorData({ displayName: "Custom Tablet - 6.0.0 - API 23 - 1536x2048", imageIdentifier: "da83e290-4d54-4b94-8654-540cf0c96604", version: "5.0" }));
			assert.deepEqual(result.devices[2], getAvailableEmulatorData({ displayName: "Custom Phone - 5.1.0 - API 22 - 768x1280", imageIdentifier: "94761c90-759f-4ae4-8eb3-8929a57a7ceb", version: "5.0" }));
			assert.deepEqual(result.devices[3], getAvailableEmulatorData({ displayName: "test", imageIdentifier: "4a1bf7cd-a7b4-45ef-8cb0-c5a0aafad211", version: "5.0" }));
			assert.deepEqual(result.errors, []);
		});

		it("should return correct error when Genymotion player cannot be found", async () => {
			const mapEnumerateGuestPropertiesOutput = {
				"9d9beef2-cc60-4a54-bcc0-cc1dbf89811f": { properties: enumerateGuestPropertiesOutput },
				"da83e290-4d54-4b94-8654-540cf0c96604": { properties: enumerateGuestPropertiesOutput }
			};

			mockVirtualBoxService({ vms, error: null }, mapEnumerateGuestPropertiesOutput);
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			childProcess.trySpawnFromCloseEvent = async (command: string, args: string[], options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> => {
				return <any>{ stderr: "some error" };
			};

			const errorHelp = "Error help";
			(<any>androidGenymotionService).getConfigurationPlatformSpecficErrorMessage = () => errorHelp;
			const result = await androidGenymotionService.getEmulatorImages([]);
			assert.lengthOf(result.devices, 2);
			assert.deepEqual(result.devices[0], getAvailableEmulatorData({ displayName: "Google Nexus 4 - 5.0.0 - API 21 - 768x1280", imageIdentifier: "9d9beef2-cc60-4a54-bcc0-cc1dbf89811f", version: "5.0", errorHelp }));
			assert.deepEqual(result.devices[1], getAvailableEmulatorData({ displayName: "Custom Tablet - 6.0.0 - API 23 - 1536x2048", imageIdentifier: "da83e290-4d54-4b94-8654-540cf0c96604", version: "5.0", errorHelp }));
			assert.deepEqual(result.errors, []);
		});

		it("should return all emulators when Genymotion player prints its default message on stderr", async () => {
			const mapEnumerateGuestPropertiesOutput = {
				"9d9beef2-cc60-4a54-bcc0-cc1dbf89811f": { properties: enumerateGuestPropertiesOutput },
				"da83e290-4d54-4b94-8654-540cf0c96604": { properties: enumerateGuestPropertiesOutput }
			};

			mockVirtualBoxService({ vms, error: null }, mapEnumerateGuestPropertiesOutput);
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			childProcess.trySpawnFromCloseEvent = async (command: string, args: string[], options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> => {
				return <any>{ stderr: AndroidVirtualDevice.GENYMOTION_DEFAULT_STDERR_STRING, exitCode: 1 };
			};

			const result = await androidGenymotionService.getEmulatorImages([]);
			assert.lengthOf(result.devices, 2);
			assert.deepEqual(result.devices[0], getAvailableEmulatorData({ displayName: "Google Nexus 4 - 5.0.0 - API 21 - 768x1280", imageIdentifier: "9d9beef2-cc60-4a54-bcc0-cc1dbf89811f", version: "5.0" }));
			assert.deepEqual(result.devices[1], getAvailableEmulatorData({ displayName: "Custom Tablet - 6.0.0 - API 23 - 1536x2048", imageIdentifier: "da83e290-4d54-4b94-8654-540cf0c96604", version: "5.0" }));
			assert.deepEqual(result.errors, []);
		});

		it("should return all emulators when there are available and running emulators", async () => {
			const mapEnumerateGuestPropertiesOutput = {
				"9d9beef2-cc60-4a54-bcc0-cc1dbf89811f": { properties: enumerateGuestPropertiesOutput },
				"da83e290-4d54-4b94-8654-540cf0c96604": { properties: enumerateGuestPropertiesOutput },
				"94761c90-759f-4ae4-8eb3-8929a57a7ceb": { properties: enumerateGuestPropertiesOutput },
				"4a1bf7cd-a7b4-45ef-8cb0-c5a0aafad211": { properties: enumerateGuestPropertiesOutput }
			};
			mockVirtualBoxService({ vms, error: null }, mapEnumerateGuestPropertiesOutput);
			(<any>androidGenymotionService).isGenymotionEmulator = (emulatorId: string) => Promise.resolve(true);
			androidGenymotionService.getRunningEmulatorName = (emulatorId: string) => Promise.resolve("test");
			const result = await androidGenymotionService.getEmulatorImages(["192.168.56.101:5555	device"]);
			assert.lengthOf(result.devices, 4);
			assert.deepEqual(result.devices[0], getAvailableEmulatorData({ displayName: "Google Nexus 4 - 5.0.0 - API 21 - 768x1280", imageIdentifier: "9d9beef2-cc60-4a54-bcc0-cc1dbf89811f", version: "5.0" }));
			assert.deepEqual(result.devices[1], getAvailableEmulatorData({ displayName: "Custom Tablet - 6.0.0 - API 23 - 1536x2048", imageIdentifier: "da83e290-4d54-4b94-8654-540cf0c96604", version: "5.0" }));
			assert.deepEqual(result.devices[2], getAvailableEmulatorData({ displayName: "Custom Phone - 5.1.0 - API 22 - 768x1280", imageIdentifier: "94761c90-759f-4ae4-8eb3-8929a57a7ceb", version: "5.0" }));
			assert.deepEqual(result.devices[3], getRunningEmulatorData({ displayName: "test", identifier: "192.168.56.101:5555", imageIdentifier: "4a1bf7cd-a7b4-45ef-8cb0-c5a0aafad211", version: "5.0" }));
			assert.deepEqual(result.errors, []);
		});
	});

	describe("getRunningEmulatorIds", () => {
		it("should return [] when there are no running emulators", async () => {
			mockAdbGetPropertyValue([], "", "");
			const emulators = await androidGenymotionService.getRunningEmulatorIds([]);
			assert.deepEqual(emulators, []);
		});
		it("should return the devices when there are running emulators", async () => {
			mockAdbGetPropertyValue(["192.168.56.101:5555", "192.168.56.102:5555"], "ro.build.product", "vbox");
			const emulators = await androidGenymotionService.getRunningEmulatorIds(["192.168.56.101:5555	device", "192.168.56.102:5555	device"]);
			assert.deepEqual(emulators, ["192.168.56.101:5555", "192.168.56.102:5555"]);
		});
	});
});
