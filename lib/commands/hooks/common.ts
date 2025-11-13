import * as _ from "lodash";
import { IProjectData } from "../../definitions/project";
import { IPluginData } from "../../definitions/plugins";
import { ICommandParameter } from "../../common/definitions/commands";
import { IErrors, IFileSystem } from "../../common/declarations";
import path = require("path");
import * as crypto from "crypto";

export const LOCK_FILE_NAME = "nativescript-lock.json";
export interface OutputHook {
	type: string;
	hash: string;
}

export interface OutputPlugin {
	name: string;
	hooks: OutputHook[];
}

export class HooksVerify {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $fs: IFileSystem,
		protected $logger: ILogger,
	) {
		this.$projectData.initializeProjectData();
	}

	protected async verifyHooksLock(
		plugins: IPluginData[],
		hooksLockPath: string,
	): Promise<void> {
		let lockFileContent: string;
		let hooksLock: OutputPlugin[];

		try {
			lockFileContent = this.$fs.readText(hooksLockPath, "utf8");
			hooksLock = JSON.parse(lockFileContent);
		} catch (err) {
			this.$errors.fail(
				`❌ Failed to read or parse ${LOCK_FILE_NAME} at ${hooksLockPath}`,
			);
		}

		const lockMap = new Map<string, Map<string, string>>(); // pluginName -> hookType -> hash

		for (const plugin of hooksLock) {
			const hookMap = new Map<string, string>();
			for (const hook of plugin.hooks) {
				hookMap.set(hook.type, hook.hash);
			}
			lockMap.set(plugin.name, hookMap);
		}

		let isValid = true;

		for (const plugin of plugins) {
			const pluginLockHooks = lockMap.get(plugin.name);

			if (!pluginLockHooks) {
				this.$logger.error(
					`❌ Plugin '${plugin.name}' not found in ${LOCK_FILE_NAME}`,
				);
				isValid = false;
				continue;
			}

			for (const hook of plugin.nativescript?.hooks || []) {
				const expectedHash = pluginLockHooks.get(hook.type);

				if (!expectedHash) {
					this.$logger.error(
						`❌ Missing hook '${hook.type}' for plugin '${plugin.name}' in ${LOCK_FILE_NAME}`,
					);
					isValid = false;
					continue;
				}

				let fileContent: string | Buffer<ArrayBufferLike>;

				try {
					fileContent = this.$fs.readFile(
						path.join(plugin.fullPath, hook.script),
					);
				} catch (err) {
					this.$logger.error(
						`❌ Cannot read script file '${hook.script}' for hook '${hook.type}' in plugin '${plugin.name}'`,
					);
					isValid = false;
					continue;
				}

				const actualHash = crypto
					.createHash("sha256")
					.update(fileContent)
					.digest("hex");

				if (actualHash !== expectedHash) {
					this.$logger.error(
						`❌ Hash mismatch for '${hook.script}' (${hook.type} in ${plugin.name}):`,
					);
					this.$logger.error(`   Expected: ${expectedHash}`);
					this.$logger.error(`   Actual:   ${actualHash}`);
					isValid = false;
				}
			}
		}

		if (isValid) {
			this.$logger.info("✅ All hooks verified successfully. No issues found.");
		} else {
			this.$errors.fail("❌ One or more hooks failed verification.");
		}
	}
}
