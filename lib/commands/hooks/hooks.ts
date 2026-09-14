import { IPluginData } from "../../definitions/plugins";
import { CommandContext, defineCommand } from "../../common/define-command";
import { registerCommand } from "../../common/services/command-definition-adapter";
import path = require("path");
import { HOOKS_DIR_NAME } from "../../constants";
import { createTable } from "../../common/helpers";
import nsHooks = require("@nativescript/hook");
import {
	getPluginsWithHooks,
	IHooksCommandServices,
	injectHooksCommandServices,
	LOCK_FILE_NAME,
	verifyHooksLock,
} from "./common";

function listHooks(
	services: IHooksCommandServices,
	pluginsWithHooks: IPluginData[],
): void {
	const headers: string[] = ["Plugin", "HookName", "HookPath"];
	const hookDataData: string[][] = pluginsWithHooks.flatMap((plugin) =>
		plugin.nativescript.hooks.map((hook: { type: string; script: string }) => {
			return [plugin.name, hook.type, hook.script];
		}),
	);
	const hookDataTable: any = createTable(headers, hookDataData);
	services.$logger.info("Hooks:");
	services.$logger.info(hookDataTable.toString());
}

async function installHooks(
	services: IHooksCommandServices,
	pluginsWithHooks: IPluginData[],
): Promise<void> {
	const hooksDir = path.join(services.$projectData.projectDir, HOOKS_DIR_NAME);

	if (
		services.$fs.exists(
			path.join(services.$projectData.projectDir, LOCK_FILE_NAME),
		)
	) {
		await verifyHooksLock(
			services,
			pluginsWithHooks,
			path.join(services.$projectData.projectDir, LOCK_FILE_NAME),
		);
	}

	if (pluginsWithHooks.length === 0) {
		if (!services.$fs.exists(hooksDir)) {
			services.$fs.createDirectory(hooksDir);
		}
	}
	for (const plugin of pluginsWithHooks) {
		nsHooks(plugin.fullPath).postinstall();
	}
}

export async function runHooksCommand(
	services: IHooksCommandServices,
	isList: boolean,
): Promise<void> {
	const plugins: IPluginData[] =
		await services.$pluginsService.getAllInstalledPlugins(
			services.$projectData,
		);
	if (plugins && plugins.length > 0) {
		const pluginsWithHooks = getPluginsWithHooks(plugins);

		if (isList) {
			listHooks(services, pluginsWithHooks);
		} else {
			await installHooks(services, pluginsWithHooks);
		}
	}
}

export function canExecuteHooksCommand(
	context: CommandContext,
	services: IHooksCommandServices,
): boolean {
	if (context.args.length > 0 && context.args[0] !== "list") {
		services.$errors.failWithHelp(
			`Invalid argument ${context.args[0]}. Supported argument is "list".`,
		);
	}
	return true;
}

export const hooksInstallCommandDefinition = defineCommand({
	name: "hooks|install",
	description: "Runs the postinstall hook of every installed plugin.",
	arguments: "any",
	setup: injectHooksCommandServices,
	canExecute: canExecuteHooksCommand,
	run(context, services): Promise<void> {
		return runHooksCommand(services, context.args[0] === "list");
	},
});

export const hooksListCommandDefinition = defineCommand({
	name: "hooks|*list",
	description: "Lists the hooks every installed plugin contributes.",
	arguments: "any",
	setup: injectHooksCommandServices,
	// The name accepts "list" as its only argument, and lists either way.
	canExecute: canExecuteHooksCommand,
	run(context, services): Promise<void> {
		return runHooksCommand(services, true);
	},
});

registerCommand(hooksInstallCommandDefinition);
registerCommand(hooksListCommandDefinition);
