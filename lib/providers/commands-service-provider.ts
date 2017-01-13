export class CommandsServiceProvider implements ICommandsServiceProvider {
	public dynamicCommandsPrefix = "";

	public async getDynamicCommands(): Promise<string[]> {
		return [];
	}

	public async generateDynamicCommands(): Promise<void> {
		return ;
	}

	public registerDynamicSubCommands(): void {
		/* intentionally left blank */
	}
}
$injector.register("commandsServiceProvider", CommandsServiceProvider);
