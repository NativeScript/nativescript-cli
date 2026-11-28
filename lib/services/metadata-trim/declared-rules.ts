import { readFileSync } from "fs";
import {
	INativeApiUsageConfiguration,
	INativeApiUsagePluginConfiguration,
} from "../../definitions/metadata-filtering-service";
import { IDeclaredMetadataRules } from "../../definitions/metadata-trim-service";

/**
 * Follows the rules `ns prepare` applies to native-api-usage.json, with one
 * difference: an app with no file of its own still keeps what its plugins
 * declare, because declarations here only add to what the analysis found.
 */
export function mergeDeclaredRules(
	app: INativeApiUsageConfiguration | null | undefined,
	plugins: INativeApiUsagePluginConfiguration[],
): IDeclaredMetadataRules {
	const usesPlugins = !app || app["whitelist-plugins-usages"];
	const pluginUses = usesPlugins
		? plugins.flatMap((plugin) => plugin.uses ?? [])
		: [];
	const pluginBlacklist =
		app && usesPlugins
			? plugins.flatMap((plugin) => plugin.blacklist ?? [])
			: [];

	return {
		keep: [...(app?.whitelist ?? []), ...pluginUses],
		blacklist: [...(app?.blacklist ?? []), ...pluginBlacklist],
	};
}

/** Reads a native-api-usage.json in either the app or the plugin format. */
export function readDeclaredRules(filePath: string): IDeclaredMetadataRules {
	let content: any;
	try {
		content = JSON.parse(readFileSync(filePath, "utf8"));
	} catch (err) {
		throw new Error(`Cannot read ${filePath}: ${(err as Error).message}`);
	}
	return {
		keep: [...(content.whitelist ?? []), ...(content.uses ?? [])],
		blacklist: content.blacklist ?? [],
	};
}
