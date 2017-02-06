import * as constants from "../../constants";
import * as helpers from "../../common/helpers";
import * as path from "path";
import * as semver from "semver";
import * as fiberBootstrap from "../../common/fiber-bootstrap";
import { NodeModulesDependenciesBuilder } from "../../tools/node-modules/node-modules-dependencies-builder";

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
		private $liveSyncProvider: ILiveSyncProvider,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicesService: Mobile.IDevicesService,
		private $options: IOptions,
		private $logger: ILogger,
		private $dispatcher: IFutureDispatcher,
		private $hooksService: IHooksService,
		private $processService: IProcessService) { }

	private ensureAndroidFrameworkVersion(platformData: IPlatformData): IFuture<void> { // TODO: this can be moved inside command or canExecute function
		return (() => {
			this.$projectDataService.initialize(this.$projectData.projectDir);
			let frameworkVersion = this.$projectDataService.getValue(platformData.frameworkPackageName).version;

			if (platformData.normalizedPlatformName.toLowerCase() === this.$devicePlatformsConstants.Android.toLowerCase()) {
				if (semver.lt(frameworkVersion, "1.2.1")) {
					let shouldUpdate = this.$prompter.confirm("You need Android Runtime 1.2.1 or later for LiveSync to work properly. Do you want to update your runtime now?").wait();
					if (shouldUpdate) {
						this.$platformService.updatePlatforms([this.$devicePlatformsConstants.Android.toLowerCase()]).wait();
					} else {
						return;
					}
				}
			}
		}).future<void>()();
	}

	public get isInitialized(): boolean { // This function is used from https://github.com/NativeScript/nativescript-dev-typescript/blob/master/lib/before-prepare.js#L4
		return this._isInitialized;
	}

	public liveSync(platform: string, applicationReloadAction?: (deviceAppData: Mobile.IDeviceAppData) => IFuture<void>): IFuture<void> {
		return (() => {
			if (this.$options.justlaunch) {
				this.$options.watch = false;
			}
			let liveSyncData: ILiveSyncData[] = [];
			if (platform) {
				this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device  }).wait();
				liveSyncData.push(this.prepareLiveSyncData(platform));
			} else if (this.$options.device) {
				this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device }).wait();
				platform = this.$devicesService.getDeviceByIdentifier(this.$options.device).deviceInfo.platform;
				liveSyncData.push(this.prepareLiveSyncData(platform));
			} else {
				this.$devicesService.initialize({ skipInferPlatform: true }).wait();
				this.$devicesService.stopDeviceDetectionInterval().wait();
				for(let installedPlatform of this.$platformService.getInstalledPlatforms()) {
					if (this.$devicesService.getDevicesForPlatform(installedPlatform).length === 0) {
						this.$devicesService.startEmulator(installedPlatform).wait();
					}
					liveSyncData.push(this.prepareLiveSyncData(installedPlatform));
				}
			}
            if (liveSyncData.length === 0) {
				this.$errors.fail("There are no platforms installed in this project. Please specify platform or install one by using `tns platform add` command!");
            }
			this._isInitialized = true; // If we want before-prepare hooks to work properly, this should be set after preparePlatform function

			this.liveSyncCore(liveSyncData, applicationReloadAction).wait();
		}).future<void>()();
	}

	private prepareLiveSyncData(platform: string): ILiveSyncData {
		platform = platform || this.$devicesService.platform;
		let platformData = this.$platformsData.getPlatformData(platform.toLowerCase());
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			this.ensureAndroidFrameworkVersion(platformData).wait();
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
	private liveSyncCore(liveSyncData: ILiveSyncData[], applicationReloadAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): IFuture<void> {
		return (() => {
			this.$platformService.trackProjectType().wait();

			let watchForChangeActions: ((event: string, filePath: string, dispatcher: IFutureDispatcher) => void)[] = [];
			_.each(liveSyncData, (dataItem) => {
				let service: IPlatformLiveSyncService = this.$injector.resolve("platformLiveSyncService", { _liveSyncData: dataItem });
				watchForChangeActions.push((event: string, filePath: string, dispatcher: IFutureDispatcher) => {
					service.partialSync(event, filePath, dispatcher, applicationReloadAction);
				});
				service.fullSync(applicationReloadAction).wait();
			});

			if(this.$options.watch && !this.$options.justlaunch) {
				this.$hooksService.executeBeforeHooks('watch').wait();
				this.partialSync(liveSyncData[0].syncWorkingDirectory, watchForChangeActions);
			}
		}).future<void>()();
	}

	private partialSync(syncWorkingDirectory: string, onChangedActions: ((event: string, filePath: string, dispatcher: IFutureDispatcher) => void )[]): void {
		let that = this;
		let dependenciesBuilder = this.$injector.resolve(NodeModulesDependenciesBuilder, {});
		let productionDependencies = dependenciesBuilder.getProductionDependencies(this.$projectData.projectDir);
		let pattern = ["app"];

		if(this.$options.syncAllFiles) {
			pattern.push("package.json");

			// watch only production node_module/packages same one prepare uses
			for(let index in productionDependencies) {
				pattern.push("node_modules/" + productionDependencies[index].name);
			}
		}

		let watcher = choki.watch(pattern, { ignoreInitial: true, cwd: syncWorkingDirectory, ignored: '**/*.DS_Store' }).on("all", (event: string, filePath: string) => {
			fiberBootstrap.run(() => {
				that.$dispatcher.dispatch(() => (() => {
					try {
						that.$logger.trace(`Event '${event}' triggered for path: '${filePath}'`);
						filePath = path.join(syncWorkingDirectory, filePath);
						for (let i = 0; i < onChangedActions.length; i++) {
							onChangedActions[i](event, filePath, that.$dispatcher);
						}
					} catch (err) {
						that.$logger.info(`Unable to sync file ${filePath}. Error is:${err.message}`.red.bold);
						that.$logger.info("Try saving it again or restart the livesync operation.");
					}
				}).future<void>()());
			});
		});

		this.$processService.attachToProcessExitSignals(this, () => {
			watcher.close(pattern);
		});
		this.$dispatcher.run();
	}
}
$injector.register("usbLiveSyncService", LiveSyncService);
