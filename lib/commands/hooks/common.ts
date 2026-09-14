import { IProjectData } from "../../definitions/project";
import { IPluginData, IPluginsService } from "../../definitions/plugins";
import { IErrors, IFileSystem } from "../../common/declarations";
import { inject } from "../../common/di";
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

/** Callable from `setup` and from `canExecute` before their first `await`. */
export function injectHooksCommandServices() {
	const services = {
		$pluginsService: inject<IPluginsService>("pluginsService"),
		$projectData: inject<IProjectData>("projectData"),
		$errors: inject<IErrors>("errors"),
		$fs: inject<IFileSystem>("fs"),
		$logger: inject<ILogger>("logger"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export type IHooksCommandServices = ReturnType<
	typeof injectHooksCommandServices
>;

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
	services: IHooksCommandServices,
	plugins: IPluginData[],
	hooksLockPath: string,
): Promise<void> {
	let lockFileContent: string;
	let hooksLock: OutputPlugin[];

	try {
		lockFileContent = services.$fs.readText(hooksLockPath, "utf8");
		hooksLock = JSON.parse(lockFileContent);
	} catch (err) {
		services.$errors.fail(
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
			services.$logger.error(
				`❌ Plugin '${plugin.name}' not found in ${LOCK_FILE_NAME}`,
			);
			isValid = false;
			continue;
		}

		for (const hook of plugin.nativescript?.hooks || []) {
			const expectedHash = pluginLockHooks.get(hook.type);

			if (!expectedHash) {
				services.$logger.error(
					`❌ Missing hook '${hook.type}' for plugin '${plugin.name}' in ${LOCK_FILE_NAME}`,
				);
				isValid = false;
				continue;
			}

			let fileContent: string | Buffer<ArrayBufferLike>;

			try {
				fileContent = services.$fs.readFile(
					path.join(plugin.fullPath, hook.script),
				);
			} catch (err) {
				services.$logger.error(
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
				services.$logger.error(
					`❌ Hash mismatch for '${hook.script}' (${hook.type} in ${plugin.name}):`,
				);
				services.$logger.error(`   Expected: ${expectedHash}`);
				services.$logger.error(`   Actual:   ${actualHash}`);
				isValid = false;
			}
		}
	}

	if (isValid) {
		services.$logger.info(
			"✅ All hooks verified successfully. No issues found.",
		);
	} else {
		services.$errors.fail("❌ One or more hooks failed verification.");
	}
}
