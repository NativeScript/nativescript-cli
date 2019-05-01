/**
 * Describes information about how to build the native project.
 */
interface IBuildPlatformAction {
	/**
	 * Builds the native project for the specified platform for device or emulator.
	 * When finishes, build saves the .nsbuildinfo file in platform product folder.
	 * This file points to the prepare that was used to build the project and allows skipping unnecessary builds and deploys.
	 * @param {string} platform The platform to build.
	 * @param {IBuildConfig} buildConfig Indicates whether the build is for device or emulator.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {Promise<string>} The path to the built file.
	 */
	buildPlatform(platform: string, buildConfig: IBuildConfig, projectData: IProjectData): Promise<string>;
}

interface IPlatformOptions extends IPlatformSpecificData, ICreateProjectOptions { }

/**
 * Platform specific data required for project preparation.
 */
interface IPlatformSpecificData extends IProvision, ITeamIdentifier {
	/**
	 * Target SDK for Android.
	 */
	sdk: string;

	/**
	 * Data from mobileProvision.
	 */
	mobileProvisionData?: any;
}

interface IPlatformData {
	frameworkPackageName: string;
	platformProjectService: IPlatformProjectService;
	projectRoot: string;
	normalizedPlatformName: string;
	platformNameLowerCase: string;
	appDestinationDirectoryPath: string;
	getBuildOutputPath(options: IBuildOutputOptions): string;
	getValidBuildOutputData(buildOptions: IBuildOutputOptions): IValidBuildOutputData;
	frameworkFilesExtensions: string[];
	frameworkDirectoriesExtensions?: string[];
	frameworkDirectoriesNames?: string[];
	targetedOS?: string[];
	configurationFileName?: string;
	configurationFilePath?: string;
	relativeToFrameworkConfigurationFilePath: string;
	fastLivesyncFileExtensions: string[];
}

interface IValidBuildOutputData {
	packageNames: string[];
	regexes?: RegExp[];
}

interface IBuildOutputOptions extends Partial<IBuildForDevice>, IRelease, IHasAndroidBundle { }

interface IPlatformsData {
	availablePlatforms: any;
	platformsNames: string[];
	getPlatformData(platform: string, projectData: IProjectData): IPlatformData;
}

interface IAppFilesUpdaterOptionsComposition {
	appFilesUpdaterOptions: IAppFilesUpdaterOptions;
}

interface INodeModulesData extends IPlatform, IProjectDataComposition, IAppFilesUpdaterOptionsComposition {
	absoluteOutputPath: string;
	lastModifiedTime: Date;
	projectFilesConfig: IProjectFilesConfig;
}

interface INodeModulesBuilder {
	prepareNodeModules(platformData: IPlatformData, projectData: IProjectData): Promise<void>;
}

interface INodeModulesDependenciesBuilder {
	getProductionDependencies(projectPath: string): IDependencyData[];
}

interface IBuildInfo {
	prepareTime: string;
	buildTime: string;
	/**
	 * Currently it is used only for iOS.
	 * As `xcrun` command does not throw an error when IPHONEOS_DEPLOYMENT_TARGET is provided in `xcconfig` file and
	 * the simulator's version does not match IPHONEOS_DEPLOYMENT_TARGET's value, we need to save it to buildInfo file
	 * in order check it on livesync and throw an error to the user.
	*/
	deploymentTarget?: string;
}

interface IPlatformDataComposition {
	platformData: IPlatformData;
}

interface ICopyAppFilesData extends IProjectDataComposition, IAppFilesUpdaterOptionsComposition, IPlatformDataComposition, IOptionalFilesToSync, IOptionalFilesToRemove { }

interface IPreparePlatformJSInfo extends IPreparePlatformCoreInfo, ICopyAppFilesData {
	projectFilesConfig?: IProjectFilesConfig;
}

interface IPlatformOptions extends IRelease, IHasUseHotModuleReloadOption {
}

interface IShouldPrepareInfo extends IOptionalProjectChangesInfoComposition {
	platformInfo: IPreparePlatformInfo;
}

interface IOptionalProjectChangesInfoComposition {
	changesInfo?: IProjectChangesInfo;
}

interface IPreparePlatformCoreInfo extends IPreparePlatformInfoBase, IOptionalProjectChangesInfoComposition {
	platformSpecificData: IPlatformSpecificData;
}

interface IPreparePlatformInfo extends IPreparePlatformInfoBase, IPlatformConfig {
	webpackCompilerConfig: IWebpackCompilerConfig;
}

interface IPlatformConfig {
	config: IPlatformOptions;
}

interface IOptionalFilesToSync {
	filesToSync?: string[];
}

interface IOptionalFilesToRemove {
	filesToRemove?: string[];
}

interface IPreparePlatformInfoBase extends IPlatform, IAppFilesUpdaterOptionsComposition, IProjectDataComposition, IEnvOptions, IOptionalFilesToSync, IOptionalFilesToRemove, IOptionalNativePrepareComposition { }

interface IOptionalNativePrepareComposition {
	nativePrepare?: INativePrepare;
}

interface IDeployPlatformInfo extends IPlatform, IAppFilesUpdaterOptionsComposition, IProjectDataComposition, IPlatformConfig, IEnvOptions, IOptionalNativePrepareComposition, IOptionalOutputPath, IBuildPlatformAction {
	deployOptions: IDeployPlatformOptions
}

interface IUpdateAppOptions extends IOptionalFilesToSync, IOptionalFilesToRemove {
	beforeCopyAction: (sourceFiles: string[]) => void;
}

interface IPlatformEnvironmentRequirements {
	checkEnvironmentRequirements(input: ICheckEnvironmentRequirementsInput): Promise<ICheckEnvironmentRequirementsOutput>;
}

interface ICheckEnvironmentRequirementsInput {
	platform?: string;
	projectDir?: string;
	runtimeVersion?: string;
	options?: IOptions;
	notConfiguredEnvOptions?: INotConfiguredEnvOptions;
}

interface ICheckEnvironmentRequirementsOutput {
	canExecute: boolean;
	selectedOption: string;
}
