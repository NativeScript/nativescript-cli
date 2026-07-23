import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";
import { WindowsDeviceLiveSyncService } from "./windows-device-livesync-service";
import { IPlatformsDataService } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";
import { IProjectFilesManager, IFileSystem } from "../../common/declarations";
import { IInjector } from "../../common/definitions/yok";
import { IOptions } from "../../declarations";
import { injector } from "../../common/yok";

export class WindowsLiveSyncService
	extends PlatformLiveSyncServiceBase
	implements IPlatformLiveSyncService
{
	constructor(
		protected $platformsDataService: IPlatformsDataService,
		protected $projectFilesManager: IProjectFilesManager,
		private $injector: IInjector,
		$devicePathProvider: IDevicePathProvider,
		$fs: IFileSystem,
		$logger: ILogger,
		$options: IOptions,
	) {
		super(
			$fs,
			$logger,
			$platformsDataService,
			$projectFilesManager,
			$devicePathProvider,
			$options,
		);
	}

	protected _getDeviceLiveSyncService(
		device: Mobile.IDevice,
		_data: IProjectData,
		_frameworkVersion: string,
	): INativeScriptDeviceLiveSyncService {
		return this.$injector.resolve<INativeScriptDeviceLiveSyncService>(
			WindowsDeviceLiveSyncService,
			{ device, platformsDataService: this.$platformsDataService },
		);
	}
}
injector.register("windowsLiveSyncService", WindowsLiveSyncService);
