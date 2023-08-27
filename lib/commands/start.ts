import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";
import { IStartService } from "../definitions/start-service";

export class StartCommand implements ICommand {
	constructor(private $startService: IStartService) {}
	async execute(args: string[]): Promise<void> {
		this.$startService.start();
		return;
	}
	allowedParameters: ICommandParameter[];
	async canExecute?(args: string[]): Promise<boolean> {
		return true;
	}
}

injector.registerCommand("start", StartCommand);
