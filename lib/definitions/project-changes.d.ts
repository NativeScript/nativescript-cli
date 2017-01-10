interface IPrepareInfo {
	time: string;
	bundle: boolean;
	release: boolean;
	changesRequireBuild: boolean;
	changesRequireBuildTime: string;

	iOSProvisioningProfileUUID?: string;
}

interface IProjectChangesInfo {
	appFilesChanged: boolean;
	appResourcesChanged: boolean;
	modulesChanged: boolean;
	configChanged: boolean;
	packageChanged: boolean;
	nativeChanged: boolean;
	hasChanges: boolean;
	changesRequireBuild: boolean;
}

interface IProjectChangesService {
	checkForChanges(platform: string): IProjectChangesInfo;
	getPrepareInfo(platform: string): IPrepareInfo;
	savePrepareInfo(platform: string): void;
	getPrepareInfoFilePath(platform: string): string;
	currentChanges: IProjectChangesInfo;
}