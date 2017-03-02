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
	checkForChanges(platform: string, projectData: IProjectData): IProjectChangesInfo;
	getPrepareInfo(platform: string, projectData: IProjectData): IPrepareInfo;
	savePrepareInfo(platform: string, projectData: IProjectData): void;
	getPrepareInfoFilePath(platform: string, projectData: IProjectData): string;
	currentChanges: IProjectChangesInfo;
}