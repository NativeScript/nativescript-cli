import * as path from "path";
import { createHash } from "crypto";
import { GRADLE_FACTS_FILE_NAME } from "../../constants";
import {
	INativeScriptGradleFacts,
	INativeScriptGradleFactsPlugin,
} from "../../definitions/gradle-facts";

export const GRADLE_FACTS_SCHEMA_VERSION = 1;

export interface IGradleFactsPluginInput {
	name: string;
	packageDir: string;
	nativeDir: string;
	aarName: string;
	dependencies: string[];
}

export interface IGradleFactsInput {
	/**
	 * Directory of the facts file; every path in the facts is relative to it.
	 */
	factsDir: string;
	cliVersion: string;
	runtime: { name?: string; version?: string };
	projectDir: string;
	appDir: string;
	appResourcesDir: string;
	/**
	 * The exact text written to dependencies.json alongside these facts.
	 */
	dependenciesJsonContent: string;
	/**
	 * In dependency order.
	 */
	plugins: IGradleFactsPluginInput[];
}

export function toFactsPath(factsDir: string, target: string): string {
	return path.relative(factsDir, target).split(path.sep).join("/") || ".";
}

export function createGradleFacts(
	input: IGradleFactsInput,
): INativeScriptGradleFacts {
	const rel = (target: string) => toFactsPath(input.factsDir, target);

	const runtime: INativeScriptGradleFacts["runtime"] = {};
	if (input.runtime?.name) {
		runtime.name = input.runtime.name;
	}
	if (input.runtime?.version) {
		runtime.version = input.runtime.version;
	}

	return {
		schemaVersion: GRADLE_FACTS_SCHEMA_VERSION,
		cli: { version: input.cliVersion },
		runtime,
		capabilities: [],
		dependenciesJson: {
			sha256: createHash("sha256")
				.update(input.dependenciesJsonContent, "utf8")
				.digest("hex"),
		},
		project: {
			root: rel(input.projectDir),
			appDir: rel(input.appDir),
			appResourcesDir: rel(input.appResourcesDir),
		},
		plugins: input.plugins.map((plugin): INativeScriptGradleFactsPlugin => ({
			name: plugin.name,
			packageDir: rel(plugin.packageDir),
			nativeDir: rel(plugin.nativeDir),
			aarName: plugin.aarName,
			aar: rel(path.join(plugin.nativeDir, `${plugin.aarName}.aar`)),
			dependencies: plugin.dependencies,
			options: {},
		})),
	};
}

export function serializeGradleFacts(facts: INativeScriptGradleFacts): string {
	return JSON.stringify(facts, null, "\t") + "\n";
}

export function getGradleFactsFilePath(androidPlatformDir: string): string {
	return path.resolve(androidPlatformDir, GRADLE_FACTS_FILE_NAME);
}
