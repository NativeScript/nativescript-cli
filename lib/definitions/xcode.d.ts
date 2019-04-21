declare module "nativescript-dev-xcode" {
	interface Options {
		[key: string]: any;

		customFramework?: boolean;
		embed?: boolean;
		relativePath?: string;
	}

	class project {
		constructor(filename: string);

		parse(callback: () => void): void;
		parseSync(): void;

		writeSync(options: any): string;

		addFramework(filepath: string, options?: Options): void;
		removeFramework(filePath: string, options?: Options): void;
		
		addPbxGroup(filePathsArray: any[], name: string, path: string, sourceTree: string): void;
		
		removePbxGroup(groupName: string, path: string): void;
		
		addToHeaderSearchPaths(options?: Options): void;
		removeFromHeaderSearchPaths(options?: Options): void;
		updateBuildProperty(key: string, value: any): void;

		pbxXCBuildConfigurationSection(): any;

		addTarget(targetName: string, targetType: string, targetPath?: string): target;
		addBuildPhase(filePathsArray: string[],
			buildPhaseType: string,
			comment: string,
			target?: string,
			optionsOrFolderType?: Object|string,
			subfolderPath?: string
		): any;
		addToBuildSettings(buildSetting: string, value: any, targetUuid?: string): void;
		addPbxGroup(
			filePathsArray: string[],
			name: string,
			path: string,
			sourceTree: string,
			opt: {filesRelativeToProject?: boolean, target?: string, uuid?: string, isMain?: boolean }
		): group;
		addBuildProperty(prop: string, value: any, build_name?: string, productName?: string): void;
		addToHeaderSearchPaths(file: string|Object, productName?: string): void;
		removeTargetsByProductType(targetType: string): void
	}

	class target {
		uuid: string;
		pbxNativeTarget: {productName: string}
	}

	class group {
		uuid: string;
		pbxGroup: Object;
	}
}

interface IiOSSigningService {
	setupSigningForDevice(projectRoot: string, projectData: IProjectData, buildConfig: IiOSBuildConfig): Promise<void>;
	setupSigningFromTeam(projectRoot: string, projectData: IProjectData, teamId: string): Promise<void>;
	setupSigningFromProvision(projectRoot: string, projectData: IProjectData, provision?: string, mobileProvisionData?: any): Promise<void>;
}

interface IXcodebuildService {
	buildForSimulator(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<void>;
	buildForDevice(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string>;
	buildForAppStore(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string>;
}

interface IXcodebuildArgsService {
	getBuildForSimulatorArgs(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string[]>;
	getBuildForDeviceArgs(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string[]>;
}

interface IXcodebuildCommandService {
	executeCommand(args: string[], options: IXcodebuildCommandOptions): Promise<ISpawnResult>;
}

interface IXcodebuildCommandOptions {
	message?: string;
	cwd: string;
	stdio?: string;
	spawnOptions?: any;
}

interface IExportOptionsPlistService {
	createDevelopmentExportOptionsPlist(archivePath: string, projectData: IProjectData, buildConfig: IBuildConfig): IExportOptionsPlistOutput;
	createDistributionExportOptionsPlist(projectRoot: string, projectData: IProjectData, buildConfig: IBuildConfig): IExportOptionsPlistOutput;
}

interface IExportOptionsPlistOutput {
	exportFileDir: string;
	exportFilePath: string;
	exportOptionsPlistFilePath: string;
}