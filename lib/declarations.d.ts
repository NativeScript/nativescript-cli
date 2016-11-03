/**
 * Describes process properties.
 */
interface IProcessInfo {
	/**
	 * The stdout of the process.
	 */
	stdout: string;

	/**
	 * The stderr of the process.
	 */
	stderr: string;

	/**
	 * The exit code of the process.
	 */
	exitCode?: number;
}

interface ISpawnFromEventOptions {
	spawnOptions?: any;
	ignoreError?: boolean;
}

interface IDictionary<T> {
	[key: string]: T
}
