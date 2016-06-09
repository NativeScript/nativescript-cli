export class PlatformCommandParameter implements ICommandParameter {
	constructor(private $platformService: IPlatformService) { }
	mandatory = true;
	validate(value: string): IFuture<boolean> {
		return (() => {
			this.$platformService.validatePlatform(value);
			return true;
		}).future<boolean>()();
	}
}
$injector.register("platformCommandParameter", PlatformCommandParameter);
