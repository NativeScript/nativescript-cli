import { EventEmitter } from "events";
import { IBuildData } from "./build";

declare global {
	interface IRunData {
		liveSyncInfo: ILiveSyncInfo;
		deviceDescriptors: ILiveSyncDeviceDescriptor[];
	}

	interface IDeployData {
		deviceDescriptors: ILiveSyncDeviceDescriptor[];
	}

	interface IStopRunData {
		projectDir: string;
		deviceIdentifiers?: string[];
		stopOptions?: {
			shouldAwaitAllActions: boolean;
			keepProcessAlive?: boolean;
		};
	}

	interface IRestartApplicationData {
		projectDir: string;
		/** Every device of the session when omitted or empty. */
		deviceIdentifiers?: string[];
	}

	interface IRunController extends EventEmitter {
		run(runData: IRunData): Promise<void>;
		stop(data: IStopRunData): Promise<void>;
		restartApplication(data: IRestartApplicationData): Promise<void>;
		getDeviceDescriptors(data: {
			projectDir: string;
		}): ILiveSyncDeviceDescriptor[];
	}

	interface IDeviceInstallAppService {
		installOnDevice(
			device: Mobile.IDevice,
			buildData: IBuildData,
			packageFile?: string,
		): Promise<void>;
		installOnDeviceIfNeeded(
			device: Mobile.IDevice,
			buildData: IBuildData,
			packageFile?: string,
		): Promise<void>;
		shouldInstall(
			device: Mobile.IDevice,
			buildData: IBuildData,
		): Promise<boolean>;
	}
}
