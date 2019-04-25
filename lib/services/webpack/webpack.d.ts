import { EventEmitter } from "events";

declare global {
	interface IWebpackCompilerService extends EventEmitter {
		startWatcher(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<void>;
	}

	interface IWebpackCompilerConfig {
		watch: boolean;
		env: IWebpackEnvOptions;
	}

	interface IWebpackEnvOptions {

	}

	interface IPreparePlatformService extends EventEmitter {
		addPlatform?(info: IAddPlatformInfo): Promise<void>;
		preparePlatform(config: IPreparePlatformJSInfo): Promise<void>;
		startWatcher(platformData: IPlatformData, projectData: IProjectData, config: IPreparePlatformJSInfo | IWebpackCompilerConfig): Promise<void>;
	}
}