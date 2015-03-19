import options = require("./../common/options");
import iOSProxyServices = require("./../common/mobile/ios/ios-proxy-services");
import iOSDevice = require("./../common/mobile/ios/ios-device");
import net = require("net");

class AndroidDebugService implements IDebugService {
	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $logger: ILogger) { }

	private get platform() { return "android"; }

	public debug(): IFuture<void> {
		return options.emulator
			? this.debugOnEmulator()
			: this.debugOnDevice();
	}

	public debugOnEmulator(): IFuture<void> {
		return (() => {
			this.$platformService.deployOnEmulator(this.platform).wait();
			this.debugOnDevice().wait();
		}).future<void>()();
	}

	public debugOnDevice(): IFuture<void> {
		return (() => {
			var platformData = this.$platformsData.getPlatformData(this.platform);
			var packageFile = "";
			var platformData = this.$platformsData.getPlatformData(this.platform);

			if (options["debug-brk"]) {
				this.$platformService.preparePlatform(this.platform).wait();

				var cachedDeviceOption = options.forDevice;
				options.forDevice = true;
				this.$platformService.buildPlatform(this.platform).wait();
				options.forDevice = cachedDeviceOption;

				packageFile = this.$platformService.getLatestApplicationPackageForDevice(platformData).wait().packageName;
				this.$logger.out("Using ", packageFile);
			}

			this.$devicesServices.initialize({ platform: this.platform, deviceId: options.device}).wait();
			var action = (device: Mobile.IAndroidDevice): IFuture<void> => { return device.debug(packageFile, this.$projectData.projectId) };
			this.$devicesServices.execute(action).wait();

		}).future<void>()();
	}
}
$injector.register("androidDebugService", AndroidDebugService);
