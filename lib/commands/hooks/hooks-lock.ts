import { IProjectData } from "../../definitions/project";
import { IPluginsService, IPluginData } from "../../definitions/plugins";
import { ICommand, ICommandParameter } from "../../common/definitions/commands";
import { IErrors, IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";
import path = require("path");
import * as crypto from "crypto";
import {
	HooksVerify,
	LOCK_FILE_NAME,
	OutputHook,
	OutputPlugin,
} from "./common";

export class HooksLockPluginCommand implements ICommand {
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

	public async execute(): Promise<void> {
		const plugins: IPluginData[] =
			await this.$pluginsService.getAllInstalledPlugins(this.$projectData);
		if (plugins && plugins.length > 0) {
			const pluginsWithHooks: IPluginData[] = [];
			for (const plugin of plugins) {
				if (plugin.nativescript?.hooks?.length > 0) {
					pluginsWithHooks.push(plugin);
				}
			}

			await this.writeHooksLockFile(
				pluginsWithHooks,
				this.$projectData.projectDir,
			);
		} else {
			this.$logger.info("No plugins with hooks found.");
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return true;
	}

	private async writeHooksLockFile(
		plugins: IPluginData[],
		outputDir: string,
	): Promise<void> {
		const output: OutputPlugin[] = [];

		for (const plugin of plugins) {
			const hooks: OutputHook[] = [];

			for (const hook of plugin.nativescript?.hooks || []) {
				try {
					const fileContent = this.$fs.readFile(
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
					this.$logger.warn(
						`Warning: Failed to read script '${hook.script}' for plugin '${plugin.name}'. Skipping this hook.`,
					);
					continue;
				}
			}

			output.push({ name: plugin.name, hooks });
		}

		const filePath = path.resolve(outputDir, LOCK_FILE_NAME);

		try {
			this.$fs.writeFile(filePath, JSON.stringify(output, null, 2), "utf8");
			this.$logger.info(`✅ ${LOCK_FILE_NAME} written to: ${filePath}`);
		} catch (err) {
			this.$errors.fail(`❌ Failed to write ${LOCK_FILE_NAME}: ${err}`);
		}
	}
}

export class HooksVerifyPluginCommand extends HooksVerify implements ICommand {
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

	public async execute(): Promise<void> {
		const plugins: IPluginData[] =
			await this.$pluginsService.getAllInstalledPlugins(this.$projectData);
		if (plugins && plugins.length > 0) {
			const pluginsWithHooks: IPluginData[] = [];
			for (const plugin of plugins) {
				if (plugin.nativescript?.hooks?.length > 0) {
					pluginsWithHooks.push(plugin);
				}
			}
			await this.verifyHooksLock(
				pluginsWithHooks,
				path.join(this.$projectData.projectDir, LOCK_FILE_NAME),
			);
		} else {
			this.$logger.info("No plugins with hooks found.");
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return true;
	}
}

injector.registerCommand(["hooks|lock"], HooksLockPluginCommand);
injector.registerCommand(["hooks|verify"], HooksVerifyPluginCommand);
