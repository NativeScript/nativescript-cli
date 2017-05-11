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
	signingChanged: boolean;

	readonly hasChanges: boolean;
	readonly changesRequireBuild: boolean;
	readonly changesRequirePrepare: boolean;
}

interface IProjectChangesOptions extends IAppFilesUpdaterOptions, IProvision {}

interface IProjectChangesService {
	checkForChanges(platform: string, projectData: IProjectData, buildOptions: IProjectChangesOptions): IProjectChangesInfo;
	getPrepareInfo(platform: string, projectData: IProjectData): IPrepareInfo;
	savePrepareInfo(platform: string, projectData: IProjectData): void;
	getPrepareInfoFilePath(platform: string, projectData: IProjectData): string;
	currentChanges: IProjectChangesInfo;
}