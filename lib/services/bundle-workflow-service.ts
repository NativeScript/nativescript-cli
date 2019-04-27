import * as path from "path";
import * as constants from "../constants";

export class BundleWorkflowService implements IBundleWorkflowService {
	constructor(
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $platformAddService: IPlatformAddService,
		private $platformsData: IPlatformsData,
		private $platformWatcherService: IPlatformWatcherService,
		private $pluginsService: IPluginsService,
		private $projectChangesService: IProjectChangesService
	) { }

	// processInfo[projectDir] = {
	// 		deviceDescriptors, nativeFilesWatcher, jsFilesWatcher
	// }

	public async start(projectData: IProjectData, deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncInfo: ILiveSyncInfo): Promise<void> {
		await this.initializeSetup(projectData);

		const platforms = _(deviceDescriptors)
			.map(device => this.$devicesService.getDeviceByIdentifier(device.identifier))
			.map(device => device.deviceInfo.platform)
			.uniq()
			.value();
		for (const platform in platforms) {
			const platformData = this.$platformsData.getPlatformData(platform, projectData);

			const shouldAddPlatform = this.shouldAddPlatform(platformData, projectData, liveSyncInfo.nativePrepare);
			if (shouldAddPlatform) {
				await this.$platformAddService.addPlatform({
					platformParam: (<any>liveSyncInfo).platformParam,
					frameworkPath: (<any>liveSyncInfo).frameworkPath,
					nativePrepare: liveSyncInfo.nativePrepare
				}, projectData);
			}

			this.$platformWatcherService.on("onInitialSync", async () => {
				console.log("================= RECEIVED INITIAL SYNC ============= ");
				// check if we should build, install, transfer files
				// AddActionToChain
			});
			this.$platformWatcherService.on("onFilesChange", () => {
				console.log("=================== RECEIVED FILES CHANGE ================ ");
				// Emitted when webpack compilatation is done and native prepare is done
				// console.log("--------- ========= ---------- ", data);
				// AddActionToChain
			});

			await this.$platformWatcherService.startWatcher(platformData, projectData, {
				webpackCompilerConfig: liveSyncInfo.webpackCompilerConfig,
				preparePlatformData: {
					release: liveSyncInfo.release,
					useHotModuleReload: liveSyncInfo.useHotModuleReload,
					nativePrepare: liveSyncInfo.nativePrepare,
					signingOptions: {
						teamId: (<any>liveSyncInfo).teamId,
						provision: (<any>liveSyncInfo).provision
					}
				}
			});
		}

		for (const deviceDescriptor in deviceDescriptors) {
			console.log("============ DEVICE DESCRIPTOR ============== ", deviceDescriptor);
		}
	}

	private async initializeSetup(projectData: IProjectData): Promise<void> {
		try {
			await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		} catch (err) {
			this.$logger.trace(err);
			this.$errors.failWithoutHelp(`Unable to install dependencies. Make sure your package.json is valid and all dependencies are correct. Error is: ${err.message}`);
		}
	}

	private shouldAddPlatform(platformData: IPlatformData, projectData: IProjectData, nativePrepare: INativePrepare): boolean {
		const platformName = platformData.normalizedPlatformName.toLowerCase();
		const prepareInfo = this.$projectChangesService.getPrepareInfo(platformName, projectData);
		const hasPlatformDirectory = this.$fs.exists(path.join(projectData.platformsDir, platformName));
		const shouldAddNativePlatform = !nativePrepare || !nativePrepare.skipNativePrepare;
		const requiresNativePlatformAdd = prepareInfo && prepareInfo.nativePlatformStatus === constants.NativePlatformStatus.requiresPlatformAdd;
		const result = !hasPlatformDirectory || (shouldAddNativePlatform && requiresNativePlatformAdd);

		return result;
	}
}
$injector.register("bundleWorkflowService", BundleWorkflowService);
