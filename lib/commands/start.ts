import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { printHeader } from "../common/header";
import { injector } from "../common/yok";
import { IStartService } from "../definitions/start-service";

export class StartCommand implements ICommand {
	constructor(private $startService: IStartService) {}
	async execute(args: string[]): Promise<void> {
		printHeader();
		this.$startService.start();
		return;
	}
	allowedParameters: ICommandParameter[];
	async canExecute?(args: string[]): Promise<boolean> {
		return true;
	}
}

injector.registerCommand("start", StartCommand);
