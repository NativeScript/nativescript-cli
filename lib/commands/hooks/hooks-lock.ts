import { IPluginData } from "../../definitions/plugins";
import { defineCommand } from "../../common/define-command";
import path = require("path");
import * as crypto from "crypto";
import {
	getPluginsWithHooks,
	IHooksCommandServices,
	injectHooksCommandServices,
	LOCK_FILE_NAME,
	OutputHook,
	OutputPlugin,
	verifyHooksLock,
} from "./common";

async function writeHooksLockFile(
	services: IHooksCommandServices,
	plugins: IPluginData[],
	outputDir: string,
): Promise<void> {
	const output: OutputPlugin[] = [];

	for (const plugin of plugins) {
		const hooks: OutputHook[] = [];

		for (const hook of plugin.nativescript?.hooks || []) {
			try {
				const fileContent = services.$fs.readFile(
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
				services.$logger.warn(
					`Warning: Failed to read script '${hook.script}' for plugin '${plugin.name}'. Skipping this hook.`,
				);
				continue;
			}
		}

		output.push({ name: plugin.name, hooks });
	}

	const filePath = path.resolve(outputDir, LOCK_FILE_NAME);

	try {
		services.$fs.writeFile(filePath, JSON.stringify(output, null, 2), "utf8");
		services.$logger.info(`✅ ${LOCK_FILE_NAME} written to: ${filePath}`);
	} catch (err) {
		services.$errors.fail(`❌ Failed to write ${LOCK_FILE_NAME}: ${err}`);
	}
}

export const hooksLockCommandDefinition = defineCommand({
	name: "hooks|lock",
	description:
		"Records a hash of every plugin hook in the project's lock file.",
	arguments: "any",
	setup: injectHooksCommandServices,
	async run(context, services): Promise<void> {
		const plugins: IPluginData[] =
			await services.$pluginsService.getAllInstalledPlugins(
				services.$projectData,
			);
		if (plugins && plugins.length > 0) {
			await writeHooksLockFile(
				services,
				getPluginsWithHooks(plugins),
				services.$projectData.projectDir,
			);
		} else {
			services.$logger.info("No plugins with hooks found.");
		}
	},
});

export const hooksVerifyCommandDefinition = defineCommand({
	name: "hooks|verify",
	description:
		"Checks every plugin hook against the hashes in the project's lock file.",
	arguments: "any",
	setup: injectHooksCommandServices,
	async run(context, services): Promise<void> {
		const plugins: IPluginData[] =
			await services.$pluginsService.getAllInstalledPlugins(
				services.$projectData,
			);
		if (plugins && plugins.length > 0) {
			await verifyHooksLock(
				services,
				getPluginsWithHooks(plugins),
				path.join(services.$projectData.projectDir, LOCK_FILE_NAME),
			);
		} else {
			services.$logger.info("No plugins with hooks found.");
		}
	},
});
