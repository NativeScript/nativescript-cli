import { EventEmitter } from "events";

declare global {

	interface IPrepareData extends IControllerDataBase {
		release: boolean;
		hmr: boolean;
		env: any;
		watch?: boolean;
	}

	interface IiOSCodeSigningData {
		teamId: string;
		provision: string;
		mobileProvisionData: any;
	}

	interface IiOSPrepareData extends IPrepareData, IiOSCodeSigningData { }

	interface IPrepareDataService {
		getPrepareData(projectDir: string, platform: string, data: any): IPrepareData;
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
		prepareNativePlatform(platformData: IPlatformData, projectData: IProjectData, prepareData: IPrepareData): Promise<boolean>;
	}
}
