import * as _ from "lodash";
import { IProjectData } from "../../definitions/project";
import { IPluginsService, IPluginData } from "../../definitions/plugins";
import { ICommand, ICommandParameter } from "../../common/definitions/commands";
import { IErrors, IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";
import path = require("path");
import { HOOKS_DIR_NAME } from "../../constants";
import { createTable } from "../../common/helpers";
import nsHooks = require("@nativescript/hook");
export class HooksPluginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $pluginsService: IPluginsService,
		private $projectData: IProjectData,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const isList: boolean =
			args.length > 0 && args[0] === "list" ? true : false;
		const plugins: IPluginData[] =
			await this.$pluginsService.getAllInstalledPlugins(this.$projectData);
		if (plugins && plugins.length > 0) {
			const hooksDir = path.join(this.$projectData.projectDir, HOOKS_DIR_NAME);
			console.log(hooksDir);
			const pluginsWithHooks: IPluginData[] = [];
			for (const plugin of plugins) {
				if (plugin.nativescript?.hooks?.length > 0) {
					pluginsWithHooks.push(plugin);
				}
			}

			if (isList) {
				const headers: string[] = ["Plugin", "HookName", "HookPath"];
				const hookDataData: string[][] = pluginsWithHooks.flatMap((plugin) =>
					plugin.nativescript.hooks.map(
						(hook: { type: string; script: string }) => {
							return [plugin.name, hook.type, hook.script];
						},
					),
				);
				const hookDataTable: any = createTable(headers, hookDataData);
				this.$logger.info("Hooks:");
				this.$logger.info(hookDataTable.toString());
			} else {
				if (pluginsWithHooks.length === 0) {
					if (!this.$fs.exists(hooksDir)) {
						this.$fs.createDirectory(hooksDir);
					}
				}
				for (const plugin of pluginsWithHooks) {
					nsHooks(plugin.fullPath).postinstall();
				}
			}
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args?.length > 50) {
			this.$errors.fail(`Plugin  is already installed.`);
		}
		return true;
	}
}
injector.registerCommand(["plugin|hooks"], HooksPluginCommand);
