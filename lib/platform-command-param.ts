export class PlatformCommandParameter implements ICommandParameter {
	constructor(private $platformService: IPlatformService,
		private $projectData: IProjectData) { }
	mandatory = true;
	async validate(value: string): Promise<boolean> {
		this.$projectData.initializeProjectData();
		this.$platformService.validatePlatform(value, this.$projectData);
		return true;
	}
}
$injector.register("platformCommandParameter", PlatformCommandParameter);
