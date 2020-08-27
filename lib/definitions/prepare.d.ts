import { EventEmitter } from "events";
import { IControllerDataBase } from "./data";
import { IPlatformData } from "./platform";
import { IProjectData } from "./project";

declare global {
	interface IPrepareData extends IControllerDataBase {
		release: boolean;
		hmr: boolean;
		env: any;
		watch?: boolean;
		watchNative: boolean;
	}

	interface IiOSCodeSigningData {
		teamId: string;
		provision: string;
		mobileProvisionData: any;
	}

	interface IiOSPrepareData extends IPrepareData, IiOSCodeSigningData {}

	interface IPrepareDataService {
		getPrepareData(
			projectDir: string,
			platform: string,
			data: any
		): IPrepareData;
	}

	interface IPrepareController extends EventEmitter {
		prepare(prepareData: IPrepareData): Promise<IPrepareResultData>;
		stopWatchers(projectDir: string, platform: string): Promise<void>;
	}

	interface IPrepareResultData {
		platform: string;
		hasNativeChanges: boolean;
	}

	interface IPrepareNativePlatformService {
		prepareNativePlatform(
			platformData: IPlatformData,
			projectData: IProjectData,
			prepareData: IPrepareData
		): Promise<boolean>;
	}
}
