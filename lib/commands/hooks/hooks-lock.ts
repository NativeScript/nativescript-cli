import { IPluginData, IPluginsService } from "../../definitions/plugins";
import { IFileSystem } from "../../common/declarations";
import { CommandContext, defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import path = require("path");
import * as crypto from "crypto";
import {
	getPluginsWithHooks,
	LOCK_FILE_NAME,
	OutputHook,
	OutputPlugin,
	verifyHooksLock,
} from "./common";
import { ProjectData } from "../../contracts/project-data";
import { provideProject } from "../command-base";

async function writeHooksLockFile(
	context: CommandContext,
	plugins: IPluginData[],
	outputDir: string,
): Promise<void> {
	const $fs = context.injector.get<IFileSystem>("fs");
	const $logger = context.injector.get<ILogger>("logger");
	const output: OutputPlugin[] = [];

	for (const plugin of plugins) {
		const hooks: OutputHook[] = [];

		for (const hook of plugin.nativescript?.hooks || []) {
			try {
				const fileContent = $fs.readFile(
					path.join(plugin.fullPath, hook.script),
				);
				const hash = crypto
					.createHash("sha256")
					.update(fileContent)
					.digest("hex");

				hooks.push({
					type: hook.type,
					hash,
				});
			} catch (err) {
				$logger.warn(
					`Warning: Failed to read script '${hook.script}' for plugin '${plugin.name}'. Skipping this hook.`,
				);
				continue;
			}
		}

		output.push({ name: plugin.name, hooks });
	}

	const filePath = path.resolve(outputDir, LOCK_FILE_NAME);

	try {
		$fs.writeFile(filePath, JSON.stringify(output, null, 2), "utf8");
		$logger.info(`✅ ${LOCK_FILE_NAME} written to: ${filePath}`);
	} catch (err) {
		context.fail(`❌ Failed to write ${LOCK_FILE_NAME}: ${err}`, {
			help: false,
		});
	}
}

export const hooksLockCommandDefinition = defineCommand({
	name: "hooks|lock",
	description:
		"Records a hash of every plugin hook in the project's lock file.",
	params: "any",
	providers: [provideProject()],
	async run(context): Promise<void> {
		const $pluginsService = inject<IPluginsService>("pluginsService");
		const $projectData = inject(ProjectData);
		const $logger = inject<ILogger>("logger");

		const plugins: IPluginData[] =
			await $pluginsService.getAllInstalledPlugins($projectData);
		if (plugins && plugins.length > 0) {
			await writeHooksLockFile(
				context,
				getPluginsWithHooks(plugins),
				$projectData.projectDir,
			);
		} else {
			$logger.info("No plugins with hooks found.");
		}
	},
});

export const hooksVerifyCommandDefinition = defineCommand({
	name: "hooks|verify",
	description:
		"Checks every plugin hook against the hashes in the project's lock file.",
	params: "any",
	providers: [provideProject()],
	async run(context): Promise<void> {
		const $pluginsService = inject<IPluginsService>("pluginsService");
		const $projectData = inject(ProjectData);
		const $logger = inject<ILogger>("logger");

		const plugins: IPluginData[] =
			await $pluginsService.getAllInstalledPlugins($projectData);
		if (plugins && plugins.length > 0) {
			await verifyHooksLock(
				context,
				getPluginsWithHooks(plugins),
				path.join($projectData.projectDir, LOCK_FILE_NAME),
			);
		} else {
			$logger.info("No plugins with hooks found.");
		}
	},
});
