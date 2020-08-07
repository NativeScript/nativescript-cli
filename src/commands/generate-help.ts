import { IHelpService } from "../common/declarations";

import { ICommand, ICommandParameter } from "../common/definitions/commands";

export class GenerateHelpCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $helpService: IHelpService) { }

	public async execute(args: string[]): Promise<void> {
		return this.$helpService.generateHtmlPages();
	}
}

$injector.registerCommand("dev-generate-help", GenerateHelpCommand);
