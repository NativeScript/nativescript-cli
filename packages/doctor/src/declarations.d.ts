/**
 * Describes process properties.
 */
interface IProcessInfo {
	/**
	 * The stdout of the process.
	 */
	stdout: string | Buffer;

	/**
	 * The stderr of the process.
	 */
	stderr: string | Buffer;

	/**
	 * The exit code of the process.
	 */
	exitCode?: number;
}

interface ISpawnFromEventOptions {
	spawnOptions?: any;
	ignoreError?: boolean;
}

/**
 * Describes single registry available for search.
 */
interface IHiveId {
	/**
	 * Name of the registry that will be checked.
	 */
	registry: string;
}

/**
 * Describes available for search registry ids.
 */
interface IHiveIds {
	/**
	 * HKEY_LOCAL_MACHINE
	 */
	HKLM: IHiveId;

	/**
	 * HKEY_CURRENT_USER
	 */
	HKCU: IHiveId;

	/**
	 * HKEY_CLASSES_ROOT
	 */
	HKCR: IHiveId;

	/**
	 * HKEY_CURRENT_CONFIG
	 */
	HKCC: IHiveId;

	/**
	 * HKEY_USERS
	 */
	HKU: IHiveId;
}

interface IDictionary<T> {
	[key: string]: T;
}

interface IVersion {
	version: string;
}

interface INativeScriptNode {
	["tns-android"]: IVersion;
	["tns-ios"]: IVersion;
}

interface INativeScriptProjectPackageJson {
	nativescript: INativeScriptNode;
	dependencies?: any;
	devDependencies?: { [name: string]: string };
}
