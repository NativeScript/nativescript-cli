import { IAndroidSigningData } from "./build";

interface IAndroidBundleToolService {
	buildApks(options: IBuildApksOptions): Promise<void>;
	installApks(options: IInstallApksOptions): Promise<void>;
}

interface IBuildApksOptions {
	aabFilePath: string;
	apksOutputPath: string;
	signingData: IAndroidSigningData;
}

interface IInstallApksOptions {
	apksFilePath: string;
	deviceId: string;
}
