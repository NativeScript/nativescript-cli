import { PrepareData } from "./prepare-data";
import { IiOSBuildData, IBuildData } from "../definitions/build";

export class BuildData extends PrepareData implements IBuildData {
	public device?: string;
	public _device?: Mobile.IDevice;
	public emulator?: boolean;
	public clean: boolean;
	public buildForDevice?: boolean;
	public buildFilterDevicesArch?: boolean;
	public buildOutputStdio?: string;
	public outputPath?: string;
	public copyTo?: string;

	constructor(projectDir: string, platform: string, data: any) {
		super(projectDir, platform, data);

		this.device = data.device;
		this._device = data?._device;
		this.emulator = data.emulator;
		this.clean = data.clean;
		this.buildForDevice = data.buildForDevice || data.forDevice;
		this.buildOutputStdio = data.buildOutputStdio;
		this.outputPath = data.outputPath;
		this.copyTo = data.copyTo;
	}
}

export class IOSBuildData extends BuildData implements IiOSBuildData {
	public teamId: string;
	public provision: string;
	public mobileProvisionData: any;
	public buildForAppStore: boolean;
	public iCloudContainerEnvironment: string;

	constructor(projectDir: string, platform: string, data: any) {
		super(projectDir, platform, data);

		this.teamId = data.teamId;
		this.provision = data.provision;
		this.mobileProvisionData = data.mobileProvisionData;
		this.buildForAppStore = data.buildForAppStore;
		this.iCloudContainerEnvironment = data.iCloudContainerEnvironment;
	}
}

export class AndroidBuildData extends BuildData {
	public keyStoreAlias: string;
	public keyStorePath: string;
	public keyStoreAliasPassword: string;
	public keyStorePassword: string;
	public androidBundle: boolean;
	public gradleFlavor: string;
	public gradlePath: string;
	public gradleArgs: string;

	constructor(projectDir: string, platform: string, data: any) {
		super(projectDir, platform, data);

		this.keyStoreAlias = data.keyStoreAlias;
		this.keyStorePath = data.keyStorePath;
		this.keyStoreAliasPassword = data.keyStoreAliasPassword;
		this.keyStorePassword = data.keyStorePassword;
		this.androidBundle = data.androidBundle || data.aab;
		this.buildFilterDevicesArch = !this.androidBundle && data.filterDevicesArch !== false ;
		this.gradleFlavor = data.flavor;
		this.gradlePath = data.gradlePath;
		this.gradleArgs = data.gradleArgs;
	}
}
