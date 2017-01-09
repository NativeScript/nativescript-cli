export class PlatformCommandParameter implements ICommandParameter {
	constructor(private $platformService: IPlatformService) { }
	mandatory = true;
	async validate(value: string): Promise<boolean> {
		this.$platformService.validatePlatform(value);
		return true;
	}
}
$injector.register("platformCommandParameter", PlatformCommandParameter);
