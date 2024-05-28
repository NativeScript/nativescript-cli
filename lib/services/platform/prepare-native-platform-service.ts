import { hook } from "../../common/helpers";
import { performanceLog } from "../../common/decorators";
import { NativePlatformStatus } from "../../constants";
import { INodeModulesBuilder, IPlatformData } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";
import { IMetadataFilteringService } from "../../definitions/metadata-filtering-service";
import { IHooksService } from "../../common/declarations";
import { injector } from "../../common/yok";
import { IOptions } from "../../declarations";

export class PrepareNativePlatformService
	implements IPrepareNativePlatformService
{
	constructor(
		public $hooksService: IHooksService,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $projectChangesService: IProjectChangesService,
		private $metadataFilteringService: IMetadataFilteringService,
		private $options: IOptions
	) {}

	@performanceLog()
	@hook("prepareNativeApp")
	public async prepareNativePlatform(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData
	): Promise<boolean> {
		const { nativePrepare, release } = prepareData;
		const changesInfo = await this.$projectChangesService.checkForChanges(
			platformData,
			projectData,
			prepareData
		);
		if (nativePrepare && nativePrepare.skipNativePrepare) {
			return changesInfo.hasChanges;
		}

		const hasNativeModulesChange = !changesInfo || changesInfo.nativeChanged;
		const hasConfigChange = !changesInfo || changesInfo.configChanged;
		const hasChangesRequirePrepare =
			!changesInfo || changesInfo.changesRequirePrepare;

		const hasChanges =
			hasNativeModulesChange || hasConfigChange || hasChangesRequirePrepare;

		if (changesInfo.hasChanges) {
			await this.cleanProject(platformData, { release });
		}

		if (!this.$options.nativeHost) {
			platformData.platformProjectService.prepareAppResources(projectData);
		}

		if (hasChangesRequirePrepare || this.$options.nativeHost) {
			await platformData.platformProjectService.prepareProject(
				projectData,
				prepareData
			);
		}

		if (hasNativeModulesChange) {
			await this.$nodeModulesBuilder.prepareNodeModules({
				platformData,
				projectData,
			});
		}

		if (hasNativeModulesChange || hasConfigChange) {
			await platformData.platformProjectService.processConfigurationFilesFromAppResources(
				projectData,
				{ release }
			);
			await platformData.platformProjectService.handleNativeDependenciesChange(
				projectData,
				{ release }
			);
			this.$metadataFilteringService.generateMetadataFilters(
				projectData,
				platformData.platformNameLowerCase
			);
		}

		platformData.platformProjectService.interpolateConfigurationFile(
			projectData
		);
		await this.$projectChangesService.setNativePlatformStatus(
			platformData,
			projectData,
			{ nativePlatformStatus: NativePlatformStatus.alreadyPrepared }
		);

		return hasChanges;
	}

	private async cleanProject(
		platformData: IPlatformData,
		options: { release: boolean }
	): Promise<void> {
		// android build artifacts need to be cleaned up
		// when switching between debug, release and webpack builds
		if (platformData.platformNameLowerCase !== "android") {
			return;
		}

		const previousPrepareInfo =
			this.$projectChangesService.getPrepareInfo(platformData);
		if (
			!previousPrepareInfo ||
			previousPrepareInfo.nativePlatformStatus !==
				NativePlatformStatus.alreadyPrepared
		) {
			return;
		}

		const { release: previousWasRelease } = previousPrepareInfo;
		const { release: currentIsRelease } = options;
		if (previousWasRelease !== currentIsRelease) {
			await platformData.platformProjectService.cleanProject(
				platformData.projectRoot
			);
		}
	}
}
injector.register("prepareNativePlatformService", PrepareNativePlatformService);
