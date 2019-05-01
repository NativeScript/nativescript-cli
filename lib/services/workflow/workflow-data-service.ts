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
				addPlatformData: new AddPlatformData("ios", options),
				preparePlatformData: new PreparePlatformData(options),
				buildPlatformData: new IOSBuildData(options),
				installOnDeviceData: {},
				liveSyncData: {},
				restartOnDeviceData: {}
			},
			android: {
				projectData,
				nativePlatformData,
				addPlatformData: new AddPlatformData("android", options),
				preparePlatformData: new PreparePlatformData(options),
				buildPlatformData: new AndroidBuildData(options),
				installOnDeviceData: {},
				liveSyncData: {},
				restartOnDeviceData: {}
			}
		};

		return data[platform.toLowerCase()];
	}
}
$injector.register("workflowDataService", WorkflowDataService);

export class WorkflowData {
	public projectData: IProjectData;
	public nativePlatformData: IPlatformData;
	public addPlatformData: AddPlatformData;
	public preparePlatformData: PreparePlatformData;
	public buildPlatformData: any;
	public installOnDeviceData: any;
	public liveSyncData: any;
	public restartOnDeviceData: any;
}

export class AddPlatformData {
	constructor(private platform: string, private options: IOptions | any) { }

	public platformParam = this.options.platformParam || this.platform;
	public frameworkPath = this.options.frameworkPath;
	public nativePrepare = this.options.nativePrepare;
}

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
