import * as lockfile from "proper-lockfile";
import * as retry from "retry";

declare global {
	interface ILockOptions extends lockfile.LockOptions {
		// workaround bug in the d.ts (`retries` should accept both number and retry obj)
		retriesObj?: retry.TimeoutsOptions;
		// backwards compatibility
		retryWait?: number;
	}

	/**
	 * Describes methods that can be used to use file locking.
	 */
	interface ILockService {
		/**
		 * @param action The code to be locked.
		 * @param {string} lockFilePath Path to lock file that has to be created. Defaults to `<profile dir>/lockfile.lock`
		 * @param {ILockOptions} lockOpts Options used for creating the lock file.
		 * @returns {Promise<T>}
		 */
		executeActionWithLock<T>(
			action: () => Promise<T>,
			lockFilePath?: string,
			lockOpts?: ILockOptions
		): Promise<T>;
		// TODO: expose as decorator

		/**
		 * Waits until the `unlock` method is called for the specified file
		 * @param {string} lockFilePath Path to lock file that has to be created. Defaults to `<profile dir>/lockfile.lock`
		 * @param {ILockOptions} lockOpts Options used for creating the lock file.
		 * @returns {Promise<() => void>} Returns a `release` function that should be called when you want to release the lock.
		 */
		lock(lockFilePath?: string, lockOpts?: ILockOptions): Promise<() => void>;

		/**
		 * Resolves the specified file lock. Whenever possible you should use the `release` function instead.
		 * @param {string} lockFilePath Path to lock file that has to be unlocked. Defaults to `<profile dir>/lockfile.lock`
		 */
		unlock(lockFilePath?: string): Promise<void>;
	}
}
