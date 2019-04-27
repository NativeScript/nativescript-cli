export class DeployCommandHelper implements IDeployCommandHelper {

	constructor(private $options: IOptions,
		private $platformService: IPlatformService,
		private $projectData: IProjectData) {
		this.$projectData.initializeProjectData();
	}

	public getDeployPlatformInfo(platform: string): IDeployPlatformInfo {
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = {
			bundle: !!this.$options.bundle,
			release: this.$options.release,
			useHotModuleReload: this.$options.hmr
		};
		const deployOptions: IDeployPlatformOptions = {
			clean: this.$options.clean,
			device: this.$options.device,
			projectDir: this.$projectData.projectDir,
			emulator: this.$options.emulator,
			release: this.$options.release,
			forceInstall: true,
			provision: this.$options.provision,
			teamId: this.$options.teamId,
			keyStoreAlias: this.$options.keyStoreAlias,
			keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
			keyStorePassword: this.$options.keyStorePassword,
			keyStorePath: this.$options.keyStorePath
		};

		const deployPlatformInfo: IDeployPlatformInfo = {
			platform,
			appFilesUpdaterOptions,
			deployOptions,
			projectData: this.$projectData,
			buildPlatform: this.$platformService.buildPlatform.bind(this.$platformService),
			config: <any>this.$options,
			env: this.$options.env,

		};

		return deployPlatformInfo;
	}
}

$injector.register("deployCommandHelper", DeployCommandHelper);
