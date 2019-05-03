export type AddPlatformData = Pick<any, 'platformParam'> & Partial<Pick<IOptions, 'frameworkPath'>> & Partial<Pick<any, 'nativePrepare'>>;

export class WorkflowDataService {
	constructor(
		private $platformsData: IPlatformsData,
		private $projectDataService: IProjectDataService,
	) { }

	public createWorkflowData(platform: string, projectDir: string, options: IOptions | any): WorkflowData {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const nativePlatformData = this.$platformsData.getPlatformData(platform, projectData);

		const data: IDictionary<WorkflowData> = {
			ios: {
				projectData,
				nativePlatformData,
				addPlatformData: this.getAddPlatformData("ios", options),
				preparePlatformData: new PreparePlatformData(options),
				buildPlatformData: new IOSBuildData(options),
				deployPlatformData: new DeployPlatformData(options),
				liveSyncData: {},
				restartOnDeviceData: {}
			},
			android: {
				projectData,
				nativePlatformData,
				addPlatformData: this.getAddPlatformData("android", options),
				preparePlatformData: new PreparePlatformData(options),
				buildPlatformData: new AndroidBuildData(options),
				deployPlatformData: new DeployPlatformData(options),
				liveSyncData: {},
				restartOnDeviceData: {}
			}
		};

		return data[platform.toLowerCase()];
	}

	private getAddPlatformData(platform: string, options: IOptions | any) {
		return {
			frameworkPath: options.frameworkPath,
			nativePrepare: options.nativePrepare,
			platformParam: options.platformParam || platform,
		};
	}
}
$injector.register("workflowDataService", WorkflowDataService);

export class WorkflowData {
	public projectData: IProjectData;
	public nativePlatformData: IPlatformData;
	public addPlatformData: AddPlatformData;
	public preparePlatformData: PreparePlatformData;
	public buildPlatformData: any;
	public deployPlatformData: DeployPlatformData;
	public liveSyncData: any;
	public restartOnDeviceData: any;
}

// export class AddPlatformData {
// 	constructor(private platform: string, private options: IOptions | any) { }

// 	public platformParam = this.options.platformParam || this.platform;
// 	public frameworkPath = this.options.frameworkPath;
// 	public nativePrepare = this.options.nativePrepare;
// }

export class PreparePlatformData {
	constructor(protected options: IOptions | any) { }

	public env = this.options.env;
	public release = this.options.release;
	public nativePrepare = this.options.nativePrepare;
}

export class IOSPrepareData extends PreparePlatformData {
	constructor(options: IOptions | any) { super(options); }

	public teamId = this.options.teamId;
	public provision = this.options.provision;
	public mobileProvisionData = this.options.mobileProvisionData;
}

export class BuildPlatformDataBase {
	constructor(protected options: IOptions | any) { }

	public release = this.options.release;
	public clean = this.options.clean;
	public device = this.options.device;
	public iCloudContainerEnvironment = this.options.iCloudContainerEnvironment;
	public buildForDevice = this.options.forDevice;
	public buildOutputStdio = this.options.buildOutputStdio || "inherit";
}

export class IOSBuildData extends BuildPlatformDataBase {
	constructor(options: IOptions) { super(options); }

	public teamId = this.options.teamId;
	public provision = this.options.provision;
}

export class AndroidBuildData extends BuildPlatformDataBase {
	constructor(options: IOptions) { super(options); }

	public keyStoreAlias = this.options.keyStoreAlias;
	public keyStorePath = this.options.keyStorePath;
	public keyStoreAliasPassword = this.options.keyStoreAliasPassword;
	public keyStorePassword = this.options.keyStorePassword;
	public androidBundle = this.options.aab;
}

export class DeployPlatformData {
	constructor(private options: IOptions) { }

	public clean = this.options.clean;
	public release = this.options.release;
	public forceInstall = true;
}
