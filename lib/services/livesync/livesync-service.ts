import * as constants from "../../constants";
import * as helpers from "../../common/helpers";
import * as path from "path";
import * as semver from "semver";
let choki = require("chokidar");

class LiveSyncService implements ILiveSyncService {
	private _isInitialized = false;

	constructor(private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $platformsData: IPlatformsData,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $prompter: IPrompter,
		private $injector: IInjector,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicesService: Mobile.IDevicesService,
		private $options: IOptions,
		private $logger: ILogger,
		private $dispatcher: IFutureDispatcher,
		private $hooksService: IHooksService,
		private $processService: IProcessService) { }

	private async ensureAndroidFrameworkVersion(platformData: IPlatformData): Promise<void> { // TODO: this can be moved inside command or canExecute function
		this.$projectDataService.initialize(this.$projectData.projectDir);
		let frameworkVersion = this.$projectDataService.getValue(platformData.frameworkPackageName).version;

		if (platformData.normalizedPlatformName.toLowerCase() === this.$devicePlatformsConstants.Android.toLowerCase()) {
			if (semver.lt(frameworkVersion, "1.2.1")) {
				let shouldUpdate = await this.$prompter.confirm("You need Android Runtime 1.2.1 or later for LiveSync to work properly. Do you want to update your runtime now?");
				if (shouldUpdate) {
					await this.$platformService.updatePlatforms([this.$devicePlatformsConstants.Android.toLowerCase()]);
				} else {
					return;
				}
			}
		}
	}

	public get isInitialized(): boolean { // This function is used from https://github.com/NativeScript/nativescript-dev-typescript/blob/master/lib/before-prepare.js#L4
		return this._isInitialized;
	}

	public async liveSync(platform: string, applicationReloadAction?: (deviceAppData: Mobile.IDeviceAppData) => Promise<void>): Promise<void> {
			if (this.$options.justlaunch) {
				this.$options.watch = false;
			}
		let liveSyncData: ILiveSyncData[] = [];

		if (platform) {
			await this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device });
			liveSyncData.push(await this.prepareLiveSyncData(platform));
		} else if (this.$options.device) {
			await this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device });
			platform = this.$devicesService.getDeviceByIdentifier(this.$options.device).deviceInfo.platform;
			liveSyncData.push(await this.prepareLiveSyncData(platform));
		} else {
			await this.$devicesService.initialize({ skipInferPlatform: true });

			await this.$devicesService.stopDeviceDetectionInterval();

			for (let installedPlatform of this.$platformService.getInstalledPlatforms()) {
				if (this.$devicesService.getDevicesForPlatform(installedPlatform).length === 0) {
					await this.$devicesService.startEmulator(installedPlatform);
				}

				liveSyncData.push(await this.prepareLiveSyncData(installedPlatform));
			}
		}

		if (liveSyncData.length === 0) {
			this.$errors.fail("There are no platforms installed in this project. Please specify platform or install one by using `tns platform add` command!");
		}

		this._isInitialized = true; // If we want before-prepare hooks to work properly, this should be set after preparePlatform function

		await this.liveSyncCore(liveSyncData, applicationReloadAction);
	}

	private async prepareLiveSyncData(platform: string): Promise<ILiveSyncData> {
		platform = platform || this.$devicesService.platform;
		let platformData = this.$platformsData.getPlatformData(platform.toLowerCase());

		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			await this.ensureAndroidFrameworkVersion(platformData);
		}

		let liveSyncData: ILiveSyncData = {
			platform: platform,
			appIdentifier: this.$projectData.projectId,
			projectFilesPath: path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME),
			syncWorkingDirectory: this.$projectData.projectDir,
			excludedProjectDirsAndFiles: this.$options.release ? constants.LIVESYNC_EXCLUDED_FILE_PATTERNS : []
		};

		return liveSyncData;
	}

	@helpers.hook('livesync')
	private async liveSyncCore(liveSyncData: ILiveSyncData[], applicationReloadAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void>): Promise<void> {
		let watchForChangeActions: ((event: string, filePath: string, dispatcher: IFutureDispatcher) => Promise<void>)[] = [];

		for (let dataItem of liveSyncData) {
			let service: IPlatformLiveSyncService = this.$injector.resolve("platformLiveSyncService", { _liveSyncData: dataItem });
			watchForChangeActions.push((event: string, filePath: string, dispatcher: IFutureDispatcher) =>
				service.partialSync(event, filePath, dispatcher, applicationReloadAction));

			await service.fullSync(applicationReloadAction);
		}

		if (this.$options.watch && !this.$options.justlaunch) {
			await this.$hooksService.executeBeforeHooks('watch');
			await this.partialSync(liveSyncData[0].syncWorkingDirectory, watchForChangeActions);
		}
	}

	private partialSync(syncWorkingDirectory: string, onChangedActions: ((event: string, filePath: string, dispatcher: IFutureDispatcher) => Promise<void>)[]): void {
		let that = this;
		let pattern = ["app", "package.json", "node_modules"];
		let watcher = choki.watch(pattern, { ignoreInitial: true, cwd: syncWorkingDirectory, ignored: '*.DS_STORE' }).on("all", (event: string, filePath: string) => {
			that.$dispatcher.dispatch(async () => {
				try {
					filePath = path.join(syncWorkingDirectory, filePath);
					for (let i = 0; i < onChangedActions.length; i++) {
						await onChangedActions[i](event, filePath, that.$dispatcher);
					}
				} catch (err) {
					that.$logger.info(`Unable to sync file ${filePath}. Error is:${err.message}`.red.bold);
					that.$logger.info("Try saving it again or restart the livesync operation.");
				}
			});
		});

		this.$processService.attachToProcessExitSignals(this, () => {
			watcher.close(pattern);
		});

		this.$dispatcher.run();
	}
}

$injector.register("usbLiveSyncService", LiveSyncService);
