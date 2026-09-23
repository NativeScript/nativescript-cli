import { IPluginData, IPluginsService } from "../../definitions/plugins";
import { IFileSystem } from "../../common/declarations";
import { CommandContext, defineCommand } from "../../common/define-command";
import path = require("path");
import { HOOKS_DIR_NAME } from "../../constants";
import { createTable } from "../../common/helpers";
import nsHooks = require("@nativescript/hook");
import { getPluginsWithHooks, LOCK_FILE_NAME, verifyHooksLock } from "./common";
import { ProjectData } from "../../contracts/project-data";
import { provideProject } from "../command-base";

function listHooks($logger: ILogger, pluginsWithHooks: IPluginData[]): void {
	const headers: string[] = ["Plugin", "HookName", "HookPath"];
	const hookDataData: string[][] = pluginsWithHooks.flatMap((plugin) =>
		plugin.nativescript.hooks.map((hook: { type: string; script: string }) => {
			return [plugin.name, hook.type, hook.script];
		}),
	);
	const hookDataTable: any = createTable(headers, hookDataData);
	$logger.info("Hooks:");
	$logger.info(hookDataTable.toString());
}

async function installHooks(
	context: CommandContext,
	projectDir: string,
	pluginsWithHooks: IPluginData[],
): Promise<void> {
	const $fs = context.injector.get<IFileSystem>("fs");
	const hooksDir = path.join(projectDir, HOOKS_DIR_NAME);
	const hooksLockPath = path.join(projectDir, LOCK_FILE_NAME);

	if ($fs.exists(hooksLockPath)) {
		await verifyHooksLock(context, pluginsWithHooks, hooksLockPath);
	}

	if (pluginsWithHooks.length === 0) {
		if (!$fs.exists(hooksDir)) {
			$fs.createDirectory(hooksDir);
		}
	}
	for (const plugin of pluginsWithHooks) {
		nsHooks(plugin.fullPath).postinstall();
	}
}

async function runHooksCommand(
	context: CommandContext,
	isList: boolean,
): Promise<void> {
	const $pluginsService =
		context.injector.get<IPluginsService>("pluginsService");
	const $projectData = context.injector.get(ProjectData);

	const plugins: IPluginData[] =
		await $pluginsService.getAllInstalledPlugins($projectData);
	if (plugins && plugins.length > 0) {
		const pluginsWithHooks = getPluginsWithHooks(plugins);

		if (isList) {
			listHooks(context.injector.get<ILogger>("logger"), pluginsWithHooks);
		} else {
			await installHooks(context, $projectData.projectDir, pluginsWithHooks);
		}
	}
}

function canExecuteHooksCommand(context: CommandContext): boolean {
	if (context.args.length > 0 && context.args[0] !== "list") {
		context.fail(
			`Invalid argument ${context.args[0]}. Supported argument is "list".`,
		);
	}
	return true;
}

export const hooksInstallCommandDefinition = defineCommand({
	name: "hooks|install",
	description: "Runs the postinstall hook of every installed plugin.",
	arguments: "any",
	providers: [provideProject()],
	canExecute: canExecuteHooksCommand,
	run(context): Promise<void> {
		return runHooksCommand(context, context.args[0] === "list");
	},
});

export const hooksListCommandDefinition = defineCommand({
	name: "hooks|*list",
	description: "Lists the hooks every installed plugin contributes.",
	arguments: "any",
	providers: [provideProject()],
	// The name accepts "list" as its only argument, and lists either way.
	canExecute: canExecuteHooksCommand,
	run(context): Promise<void> {
		return runHooksCommand(context, true);
	},
});
