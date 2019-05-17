import { EventEmitter } from "events";

declare global {

	interface IPrepareData extends IControllerDataBase {
		release: boolean;
		hmr: boolean;
		env: any;
		watch?: boolean;
	}

	interface IiOSPrepareData extends IPrepareData {
		teamId: string;
		provision: string;
		mobileProvisionData: any;
	}

	interface IAndroidPrepareData extends IPrepareData { }

	interface IPrepareDataService {
		getPrepareData(projectDir: string, platform: string, data: any): IPrepareData;
	}

	interface IPrepareController extends EventEmitter {
		prepare(prepareData: IPrepareData): Promise<IPrepareResultData>;
		stopWatchers(projectDir: string, platform: string): void;
	}

	interface IPrepareResultData {
		platform: string;
		hasNativeChanges: boolean;
	}

	interface IPrepareNativePlatformService {
		prepareNativePlatform(platformData: IPlatformData, projectData: IProjectData, prepareData: IPrepareData): Promise<boolean>;
	}
}