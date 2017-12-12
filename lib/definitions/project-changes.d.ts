interface IPrepareInfo extends IAddedNativePlatform {
	time: string;
	bundle: boolean;
	release: boolean;
	projectFileHash: string;
	changesRequireBuild: boolean;
	changesRequireBuildTime: string;
	iOSProvisioningProfileUUID?: string;
}

interface IProjectChangesInfo extends IAddedNativePlatform {
	appFilesChanged: boolean;
	appResourcesChanged: boolean;
	modulesChanged: boolean;
	configChanged: boolean;
	packageChanged: boolean;
	nativeChanged: boolean;
	bundleChanged: boolean;
	signingChanged: boolean;

	readonly hasChanges: boolean;
	readonly changesRequireBuild: boolean;
	readonly changesRequirePrepare: boolean;
}

interface IProjectChangesOptions extends IAppFilesUpdaterOptions, IProvision, ITeamIdentifier {
	nativePlatformStatus?: "1" | "2" | "3";
}

interface IProjectChangesService {
	checkForChanges(platform: string, projectData: IProjectData, buildOptions: IProjectChangesOptions): Promise<IProjectChangesInfo>;
	getPrepareInfo(platform: string, projectData: IProjectData): IPrepareInfo;
	savePrepareInfo(platform: string, projectData: IProjectData): void;
	getPrepareInfoFilePath(platform: string, projectData: IProjectData): string;
	setNativePlatformStatus(platform: string, projectData: IProjectData, nativePlatformStatus: IAddedNativePlatform): void;
	currentChanges: IProjectChangesInfo;
}

/**
 * NativePlatformStatus.requiresPlatformAdd | NativePlatformStatus.requiresPrepare | NativePlatformStatus.alreadyPrepared
 */
interface IAddedNativePlatform {
	nativePlatformStatus: "1" | "2" | "3";
}
