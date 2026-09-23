import { IPluginData } from "../../definitions/plugins";
import { IFileSystem } from "../../common/declarations";
import { CommandContext } from "../../common/define-command";
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

export function getPluginsWithHooks(plugins: IPluginData[]): IPluginData[] {
	const pluginsWithHooks: IPluginData[] = [];
	for (const plugin of plugins) {
		if (plugin.nativescript?.hooks?.length > 0) {
			pluginsWithHooks.push(plugin);
		}
	}

	return pluginsWithHooks;
}

export async function verifyHooksLock(
	context: CommandContext,
	plugins: IPluginData[],
	hooksLockPath: string,
): Promise<void> {
	const $fs = context.injector.get<IFileSystem>("fs");
	const $logger = context.injector.get<ILogger>("logger");

	let lockFileContent: string;
	let hooksLock: OutputPlugin[];

	try {
		lockFileContent = $fs.readText(hooksLockPath, "utf8");
		hooksLock = JSON.parse(lockFileContent);
	} catch (err) {
		context.fail(
			`❌ Failed to read or parse ${LOCK_FILE_NAME} at ${hooksLockPath}`,
			{ help: false },
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
			$logger.error(
				`❌ Plugin '${plugin.name}' not found in ${LOCK_FILE_NAME}`,
			);
			isValid = false;
			continue;
		}

		for (const hook of plugin.nativescript?.hooks || []) {
			const expectedHash = pluginLockHooks.get(hook.type);

			if (!expectedHash) {
				$logger.error(
					`❌ Missing hook '${hook.type}' for plugin '${plugin.name}' in ${LOCK_FILE_NAME}`,
				);
				isValid = false;
				continue;
			}

			let fileContent: string | Buffer<ArrayBufferLike>;

			try {
				fileContent = $fs.readFile(path.join(plugin.fullPath, hook.script));
			} catch (err) {
				$logger.error(
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
				$logger.error(
					`❌ Hash mismatch for '${hook.script}' (${hook.type} in ${plugin.name}):`,
				);
				$logger.error(`   Expected: ${expectedHash}`);
				$logger.error(`   Actual:   ${actualHash}`);
				isValid = false;
			}
		}
	}

	if (isValid) {
		$logger.info("✅ All hooks verified successfully. No issues found.");
	} else {
		context.fail("❌ One or more hooks failed verification.", {
			help: false,
		});
	}
}
