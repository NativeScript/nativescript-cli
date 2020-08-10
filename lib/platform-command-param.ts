import { IProjectData } from "./definitions/project";
import { IPlatformValidationService } from "./declarations";
import { $injector } from "./common/definitions/yok";
import { ICommandParameter } from "./common/definitions/commands";

export class PlatformCommandParameter implements ICommandParameter {
	constructor(private $platformValidationService: IPlatformValidationService,
		private $projectData: IProjectData) { }
	mandatory = true;
	async validate(value: string): Promise<boolean> {
		this.$projectData.initializeProjectData();
		this.$platformValidationService.validatePlatform(value, this.$projectData);
		return true;
	}
}
$injector.register("platformCommandParameter", PlatformCommandParameter);
