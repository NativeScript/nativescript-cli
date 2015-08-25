///<reference path="../../.d.ts"/>
"use strict";

export class RemovePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors) { }
	
	execute(args: string[]): IFuture<void> {
		return this.$pluginsService.remove(args[0]);
	}
	
	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(!args[0]) {
				this.$errors.fail("You must specify plugin name.");
			}
			
			let installedPlugins = this.$pluginsService.getAllInstalledPlugins().wait();
			let pluginName = args[0].toLowerCase();
			if(!_.any(installedPlugins, (plugin: IPluginData) => plugin.name.toLowerCase() === pluginName)) {
				this.$errors.failWithoutHelp(`Plugin "${pluginName}" is not installed.`);
			}
			
			return true;
		}).future<boolean>()();
	}
	
	public allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("plugin|remove", RemovePluginCommand);
