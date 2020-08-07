import { IInfoService } from "../declarations";

import { ICommand, ICommandParameter } from "../common/definitions/commands";

export class InfoCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $infoService: IInfoService) { }

	public async execute(args: string[]): Promise<void> {
		return this.$infoService.printComponentsInfo();
	}
}

$injector.registerCommand("info", InfoCommand);
