/**
 * Contents of platforms/android/nativescript-gradle.json, read by
 * org.nativescript:gradle-api. Mirrors gradle-api/schema/nativescript-gradle.schema.json:
 * fields are only ever added, and every path is relative to the file's
 * directory with forward slashes.
 */
export interface INativeScriptGradleFacts {
	schemaVersion: number;
	cli?: { version?: string };
	runtime?: { name?: string; version?: string };
	capabilities?: string[];
	/**
	 * Identifies the dependencies.json written together with these facts, so a
	 * reader can tell when a CLI that does not write facts has replaced it since.
	 */
	dependenciesJson: { sha256: string };
	project: INativeScriptGradleFactsProject;
	plugins: INativeScriptGradleFactsPlugin[];
}

export interface INativeScriptGradleFactsProject {
	root: string;
	appDir: string;
	appResourcesDir: string;
}

export interface INativeScriptGradleFactsPlugin {
	name: string;
	packageDir: string;
	nativeDir: string;
	aarName: string;
	aar: string;
	dependencies: string[];
	options?: Record<string, unknown>;
}
