///<reference path="../.d.ts"/>

export class CreateProjectCommand implements ICommand {
	execute(args: string[]): IFuture<void> {
		return (() => {

		}).future<void>()();
	}
}
$injector.registerCommand("create", CreateProjectCommand);
