///<reference path="../../.d.ts"/>
"use strict";

export class AddPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors) { }
	
	execute(args: string[]): IFuture<void> {
		if(!args[0]) {
			this.$errors.fail("You must specify plugin name");
		}
		
		return this.$pluginsService.add(args[0]);
	}
	
	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			return true; // TODO: validate that the specified plugin name is nativescript plugin
		}).future<boolean>()();
	}
	
	public allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("plugin|add", AddPluginCommand);
