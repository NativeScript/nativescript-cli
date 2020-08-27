import {
	IBuildConfig,
	IProjectData,
	IBuildForDevice,
	INativePrepare,
} from "./project";
import { IHasAndroidBundle, IDependencyData, IOptions } from "../declarations";
import { IControllerDataBase } from "./data";
import { IRelease } from "../common/declarations";
import { INotConfiguredEnvOptions } from "../common/definitions/commands";

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
	buildPlatform(
		platform: string,
		buildConfig: IBuildConfig,
		projectData: IProjectData
	): Promise<string>;
}

interface IPlatformData {
	frameworkPackageName: string;
	platformProjectService: IPlatformProjectService;
	projectRoot: string;
	normalizedPlatformName: string;
	platformNameLowerCase: string;
	appDestinationDirectoryPath: string;
	getBuildOutputPath(options: IBuildOutputOptions): string;
	getValidBuildOutputData(
		buildOptions: IBuildOutputOptions
	): IValidBuildOutputData;
	frameworkDirectoriesExtensions?: string[];
	frameworkDirectoriesNames?: string[];
	targetedOS?: string[];
	configurationFileName?: string;
	configurationFilePath?: string;
	relativeToFrameworkConfigurationFilePath: string;
	fastLivesyncFileExtensions: string[];
	getFrameworkVersion?(projectData: IProjectData): string;
}

interface IValidBuildOutputData {
	packageNames: string[];
	regexes?: RegExp[];
}

interface IBuildOutputOptions
	extends Partial<IBuildForDevice>,
		IRelease,
		Partial<IHasAndroidBundle> {
	outputPath?: string;
}

interface IPlatformsDataService {
	getPlatformData(platform: string, projectData: IProjectData): IPlatformData;
}

interface INodeModulesBuilder {
	prepareNodeModules(
		prepareNodeModulesData: IPrepareNodeModulesData
	): Promise<void>;
}

interface IPrepareNodeModulesData {
	platformData: IPlatformData;
	projectData: IProjectData;
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

interface IPlatformEnvironmentRequirements {
	checkEnvironmentRequirements(
		input: ICheckEnvironmentRequirementsInput
	): Promise<ICheckEnvironmentRequirementsOutput>;
}

interface ICheckEnvironmentRequirementsInput {
	platform?: string;
	projectDir?: string;
	runtimeVersion?: string;
	options?: IOptions;
	notConfiguredEnvOptions?: INotConfiguredEnvOptions;
	forceCheck?: boolean;
}

interface ICheckEnvironmentRequirementsOutput {
	canExecute: boolean;
	selectedOption: string;
}

interface IAddPlatformData extends IControllerDataBase {
	frameworkPath?: string;
}

interface IPlatformController {
	addPlatform(addPlatformData: IAddPlatformData): Promise<void>;
	addPlatformIfNeeded(addPlatformData: IAddPlatformData): Promise<void>;
}

interface IAddPlatformService {
	addPlatformSafe(
		projectData: IProjectData,
		platformData: IPlatformData,
		packageToInstall: string,
		addPlatformData: IAddPlatformData
	): Promise<string>;
	setPlatformVersion(
		platformData: IPlatformData,
		projectData: IProjectData,
		frameworkVersion: string
	): Promise<void>;
}
