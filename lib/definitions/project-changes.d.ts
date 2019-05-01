interface IAppFilesHashes {
	appFilesHashes?: IStringDictionary;
}

interface IPrepareInfo extends IAddedNativePlatform, IAppFilesHashes {
	time?: string;
	bundle?: boolean;
	release?: boolean;
	projectFileHash?: string;
	changesRequireBuild?: boolean;
	changesRequireBuildTime?: string;
	iOSProvisioningProfileUUID?: string;
}

interface IProjectChangesInfo extends IAddedNativePlatform {
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

/**
 * NativePlatformStatus.requiresPlatformAdd | NativePlatformStatus.requiresPrepare | NativePlatformStatus.alreadyPrepared
 */
interface IAddedNativePlatform {
	nativePlatformStatus: "1" | "2" | "3";
}
