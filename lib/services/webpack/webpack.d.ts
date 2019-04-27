import { EventEmitter } from "events";

declare global {
	interface IWebpackCompilerService extends EventEmitter {
		startWatcher(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<any>;
		compile(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<void>;
	}

	interface IWebpackCompilerConfig {
		env: IWebpackEnvOptions;
		watch?: boolean;
	}

	interface IWebpackEnvOptions {

	}

	interface IPreparePlatformService {
		addPlatform(platformData: IPlatformData, projectData: IProjectData, frameworkDirPath: string, frameworkVersion: string): Promise<void>;
		preparePlatform(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: IPreparePlatformData): Promise<boolean>;
	}

	interface IPreparePlatformData extends IRelease, IHasUseHotModuleReloadOption {
		signingOptions?: IiOSSigningOptions | IAndroidSigningOptions;
		nativePrepare?: INativePrepare;
		env?: any;
		frameworkPath?: string;
	}

	interface IiOSSigningOptions extends ITeamIdentifier, IProvision {
		mobileProvisionData?: any;
	}

	interface IAndroidSigningOptions {
		keyStoreAlias: string;
		keyStorePath: string;
		keyStoreAliasPassword: string;
		keyStorePassword: string;
		sdk?: string;
	}

	interface IPlatformWatcherService extends EventEmitter {
		startWatcher(platformData: IPlatformData, projectData: IProjectData, startWatcherData: IStartWatcherData): Promise<void>;
	}

	interface IStartWatcherData {
		webpackCompilerConfig: IWebpackCompilerConfig;
		preparePlatformData: IPreparePlatformData;
	}
}