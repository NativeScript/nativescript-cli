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
		stopOptions?: { shouldAwaitAllActions: boolean };
	}

	interface IRunController extends EventEmitter {
		run(runData: IRunData): Promise<void>;
		stop(data: IStopRunData): Promise<void>;
		getDeviceDescriptors(data: {
			projectDir: string;
		}): ILiveSyncDeviceDescriptor[];
	}

	interface IDeviceInstallAppService {
		installOnDevice(
			device: Mobile.IDevice,
			buildData: IBuildData,
			packageFile?: string
		): Promise<void>;
		installOnDeviceIfNeeded(
			device: Mobile.IDevice,
			buildData: IBuildData,
			packageFile?: string
		): Promise<void>;
		shouldInstall(
			device: Mobile.IDevice,
			buildData: IBuildData
		): Promise<boolean>;
	}
}
