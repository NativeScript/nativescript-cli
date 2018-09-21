import { exported } from "../../../decorators";

export class ProtonLiveSyncService implements IProtonLiveSyncService {
	private excludedProjectDirsAndFiles = ["app_resources", "plugins", ".*.tmp", ".ab"];

	private get $liveSyncServiceBase(): ILiveSyncServiceBase {
		return this.$injector.resolve("liveSyncServiceBase");
	}

	constructor(private $devicesService: Mobile.IDevicesService,
		private $fs: IFileSystem,
		private $injector: IInjector,
		private $project: Project.IProjectBase,
		private $logger: ILogger,
		private $companionAppsService: ICompanionAppsService) { }

	@exported("liveSyncService")
	public livesync(deviceDescriptors: IDeviceLiveSyncInfo[], projectDir: string, filePaths?: string[]): Promise<IDeviceLiveSyncResult>[] {
		this.$project.projectDir = projectDir;
		this.$logger.trace(`Called livesync for identifiers ${_.map(deviceDescriptors, d => d.deviceIdentifier)}. Project dir is ${projectDir}. Files are: ${filePaths}`);
		return _.map(deviceDescriptors, deviceDescriptor => this.liveSyncOnDevice(deviceDescriptor, filePaths));
	}

	@exported("liveSyncService")
	public deleteFiles(deviceDescriptors: IDeviceLiveSyncInfo[], projectDir: string, filePaths: string[]): Promise<IDeviceLiveSyncResult>[] {
		this.$project.projectDir = projectDir;
		this.$logger.trace(`Called deleteFiles for identifiers ${_.map(deviceDescriptors, d => d.deviceIdentifier)}. Project dir is ${projectDir}. Files are: ${filePaths}`);
		return _.map(deviceDescriptors, deviceDescriptor => this.liveSyncOnDevice(deviceDescriptor, filePaths, { isForDeletedFiles: true }));
	}

	private async liveSyncOnDevice(deviceDescriptor: IDeviceLiveSyncInfo, filePaths: string[], liveSyncOptions?: ILiveSyncDeletionOptions): Promise<IDeviceLiveSyncResult> {
		const isForDeletedFiles = liveSyncOptions && liveSyncOptions.isForDeletedFiles;

		const result: IDeviceLiveSyncResult = {
			deviceIdentifier: deviceDescriptor.deviceIdentifier
		};

		const device = _.find(this.$devicesService.getDeviceInstances(), d => d.deviceInfo.identifier === deviceDescriptor.deviceIdentifier);
		if (!device) {
			result.liveSyncToApp = result.liveSyncToCompanion = {
				isResolved: false,
				error: new Error(`Cannot find connected device with identifier ${deviceDescriptor.deviceIdentifier}. Available device identifiers are: ${this.$devicesService.getDeviceInstances()}`)
			};

			return result;
		}

		if (!this.$fs.exists(this.$project.projectDir)) {
			result.liveSyncToApp = result.liveSyncToCompanion = {
				isResolved: false,
				error: new Error(`Cannot execute LiveSync operation as the project dir ${this.$project.projectDir} does not exist on the file system.`)
			};

			return result;
		}

		if (!isForDeletedFiles && filePaths && filePaths.length) {
			const missingFiles = filePaths.filter(filePath => !this.$fs.exists(filePath));
			if (missingFiles && missingFiles.length) {
				result.liveSyncToApp = result.liveSyncToCompanion = {
					isResolved: false,
					error: new Error(`Cannot LiveSync files ${missingFiles.join(", ")} as they do not exist on the file system.`)
				};

				return result;
			}
		}

		const appIdentifier = await this.$project.getAppIdentifierForPlatform(this.$devicesService.platform),
			canExecute = (d: Mobile.IDevice) => d.deviceInfo.identifier === device.deviceInfo.identifier,
			livesyncData: ILiveSyncData = {
				platform: device.deviceInfo.platform,
				appIdentifier: appIdentifier,
				projectFilesPath: this.$project.projectDir,
				syncWorkingDirectory: this.$project.projectDir,
				excludedProjectDirsAndFiles: this.excludedProjectDirsAndFiles,
			};

		const canExecuteAction = await this.$liveSyncServiceBase.getCanExecuteAction(device.deviceInfo.platform, appIdentifier, canExecute);

		if (deviceDescriptor.syncToApp) {
			result.liveSyncToApp = await this.liveSyncCore(livesyncData, device, appIdentifier, canExecuteAction, { isForCompanionApp: false, isForDeletedFiles: isForDeletedFiles }, filePaths);
		}

		if (deviceDescriptor.syncToCompanion) {
			result.liveSyncToCompanion = await this.liveSyncCore(livesyncData, device, appIdentifier, canExecuteAction, { isForCompanionApp: true, isForDeletedFiles: isForDeletedFiles }, filePaths);
		}

		return result;
	}

	private async liveSyncCore(livesyncData: ILiveSyncData, device: Mobile.IDevice, appIdentifier: string, canExecuteAction: (dev: Mobile.IDevice) => boolean, liveSyncOptions: ILiveSyncOptions, filePaths: string[]): Promise<ILiveSyncOperationResult> {
		const liveSyncOperationResult: ILiveSyncOperationResult = {
			isResolved: false
		};

		if (liveSyncOptions.isForCompanionApp) {
			// We should check if the companion app is installed, not the real application.
			livesyncData.appIdentifier = appIdentifier = this.$companionAppsService.getCompanionAppIdentifier(this.$project.projectData.Framework, device.deviceInfo.platform);
		}

		if (await device.applicationManager.isApplicationInstalled(appIdentifier)) {

			const deletedFilesAction: any = liveSyncOptions && liveSyncOptions.isForDeletedFiles ? this.$liveSyncServiceBase.getSyncRemovedFilesAction(livesyncData) : null;
			const action: any = this.$liveSyncServiceBase.getSyncAction(livesyncData, filePaths, deletedFilesAction, liveSyncOptions);
			try {
				await this.$devicesService.execute(action, canExecuteAction);
				liveSyncOperationResult.isResolved = true;
			} catch (err) {
				liveSyncOperationResult.error = err;
				liveSyncOperationResult.isResolved = false;
			}
		} else {
			liveSyncOperationResult.error = new Error(`Application with id ${appIdentifier} is not installed on device with id ${device.deviceInfo.identifier} and it cannot be livesynced.`);
			liveSyncOperationResult.isResolved = false;
		}

		return liveSyncOperationResult;
	}
}
$injector.register("liveSyncService", ProtonLiveSyncService);
