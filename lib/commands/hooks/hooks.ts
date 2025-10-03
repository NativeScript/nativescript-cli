import { IProjectData } from "../../definitions/project";
import { IPluginsService, IPluginData } from "../../definitions/plugins";
import { ICommand, ICommandParameter } from "../../common/definitions/commands";
import { injector } from "../../common/yok";
import { IErrors, IFileSystem } from "../../common/declarations";
import path = require("path");
import { HOOKS_DIR_NAME } from "../../constants";
import { createTable } from "../../common/helpers";
import nsHooks = require("@nativescript/hook");
import { HooksVerify, LOCK_FILE_NAME } from "./common";

export class HooksPluginCommand extends HooksVerify implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $pluginsService: IPluginsService,
		$projectData: IProjectData,
		$errors: IErrors,
		$fs: IFileSystem,
		$logger: ILogger,
	) {
		super($projectData, $errors, $fs, $logger);
	}

	public async execute(args: string[]): Promise<void> {
		const isList: boolean =
			args.length > 0 && args[0] === "list" ? true : false;
		const plugins: IPluginData[] =
			await this.$pluginsService.getAllInstalledPlugins(this.$projectData);
		if (plugins && plugins.length > 0) {
			const hooksDir = path.join(this.$projectData.projectDir, HOOKS_DIR_NAME);
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
				if (
					this.$fs.exists(
						path.join(this.$projectData.projectDir, LOCK_FILE_NAME),
					)
				) {
					await this.verifyHooksLock(
						pluginsWithHooks,
						path.join(this.$projectData.projectDir, LOCK_FILE_NAME),
					);
				}

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
		if (args.length > 0 && args[0] !== "list") {
			this.$errors.failWithHelp(
				`Invalid argument ${args[0]}. Supported argument is "list".`,
			);
		}
		return true;
	}
}

export class HooksListPluginCommand extends HooksPluginCommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		$pluginsService: IPluginsService,
		$projectData: IProjectData,
		$errors: IErrors,
		$fs: IFileSystem,
		$logger: ILogger,
	) {
		super($pluginsService, $projectData, $errors, $fs, $logger);
	}

	public async execute(): Promise<void> {
		await super.execute(["list"]);
	}
}

injector.registerCommand(["hooks|install"], HooksPluginCommand);
injector.registerCommand(["hooks|*list"], HooksListPluginCommand);
