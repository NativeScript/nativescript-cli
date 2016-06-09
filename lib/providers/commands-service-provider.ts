import Future = require("fibers/future");

export class CommandsServiceProvider implements ICommandsServiceProvider {
	public dynamicCommandsPrefix = "";

	public getDynamicCommands(): IFuture<string[]> {
		return Future.fromResult([]);
	}

	public generateDynamicCommands(): IFuture<void> {
		return Future.fromResult();
	}

	public registerDynamicSubCommands(): void {
		/* intentionally left blank */
	}
}
$injector.register("commandsServiceProvider", CommandsServiceProvider);
