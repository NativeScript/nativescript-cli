import * as lockfile from "lockfile";

declare global {
    interface ILockOptions extends lockfile.Options { }

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
        executeActionWithLock<T>(action: () => Promise<T>, lockFilePath?: string, lockOpts?: ILockOptions): Promise<T>
        // TODO: expose as decorator
    }
}