import { ICommandParameter, ICommand } from "../common/definitions/commands";
import { IHelpService } from "../common/declarations";
import { injector } from "../common/yok";

export class GenerateHelpCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $helpService: IHelpService) { }

	public async execute(args: string[]): Promise<void> {
		return this.$helpService.generateHtmlPages();
	}
}

injector.registerCommand("dev-generate-help", GenerateHelpCommand);
