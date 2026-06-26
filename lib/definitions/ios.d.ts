import { IOSBuildData } from "../data/build-data";
import { IProjectData, IBuildConfig } from "./project";
import { IPlatformData } from "./platform";
import { ISpawnResult } from "../common/declarations";

declare global {
	interface IiOSSigningService {
		setupSigningForDevice(
			projectRoot: string,
			projectData: IProjectData,
			buildConfig: IOSBuildData,
		): Promise<void>;
		setupSigningFromTeam(
			projectRoot: string,
			projectData: IProjectData,
			teamId: string,
		): Promise<void>;
		setupSigningFromProvision(
			projectRoot: string,
			projectData: IProjectData,
			provision?: string,
			mobileProvisionData?: any,
		): Promise<void>;
	}

	interface IXcodebuildService {
		buildForSimulator(
			platformData: IPlatformData,
			projectData: IProjectData,
			buildConfig: IBuildConfig,
		): Promise<void>;
		buildForDevice(
			platformData: IPlatformData,
			projectData: IProjectData,
			buildConfig: IBuildConfig,
		): Promise<string>;
		buildForAppStore(
			platformData: IPlatformData,
			projectData: IProjectData,
			buildConfig: IBuildConfig,
		): Promise<string>;
	}

	type IosSPMPackage = IosSPMPackageDefinition & { targets?: string[] };

	interface ISPMService {
		applySPMPackages(
			platformData: IPlatformData,
			projectData: IProjectData,
			pluginSpmPackages?: IosSPMPackage[],
		);
		getSPMPackages(
			projectData: IProjectData,
			platform: string,
		): IosSPMPackage[];
		resolveSPMDependencies(
			platformData: IPlatformData,
			projectData: IProjectData,
			options?: { showProgress?: boolean },
		): Promise<void>;
		ensureSPMDependenciesResolved(
			platformData: IPlatformData,
			projectData: IProjectData,
		): Promise<void>;
	}

	interface IXcodebuildArgsService {
		getBuildForSimulatorArgs(
			platformData: IPlatformData,
			projectData: IProjectData,
			buildConfig: IBuildConfig,
		): Promise<string[]>;
		getBuildForDeviceArgs(
			platformData: IPlatformData,
			projectData: IProjectData,
			buildConfig: IBuildConfig,
		): Promise<string[]>;
		getXcodeProjectArgs(
			platformData: IPlatformData,
			projectData: IProjectData,
		): string[];
	}

	interface IXcodebuildCommandService {
		executeCommand(
			args: string[],
			options: IXcodebuildCommandOptions,
		): Promise<ISpawnResult>;
	}

	interface IXcodebuildCommandOptions {
		message?: string;
		cwd: string;
		stdio?: string;
		spawnOptions?: any;
		/**
		 * When provided, xcodebuild's output is piped (rather than inherited) and
		 * forwarded here so the caller can render its own progress UI (e.g. a
		 * spinner for Swift Package resolution/download activity).
		 */
		onProgress?: (chunk: { data: string; pipe: string }) => void;
	}

	interface IExportOptionsPlistService {
		createDevelopmentExportOptionsPlist(
			archivePath: string,
			projectData: IProjectData,
			buildConfig: IBuildConfig,
		): Promise<IExportOptionsPlistOutput>;
		createDistributionExportOptionsPlist(
			projectRoot: string,
			projectData: IProjectData,
			buildConfig: IBuildConfig,
		): Promise<IExportOptionsPlistOutput>;
	}

	interface IExportOptionsPlistOutput {
		exportFileDir: string;
		exportFilePath: string;
		exportOptionsPlistFilePath: string;
	}
}
