import * as lockfile from "lockfile";

declare global {
    interface ILockFileOptions extends lockfile.Options { }

    /**
     * Describes methods that can be used to use file locking.
     */
    interface ILockFile {
        /**
         * @param action The code to be locked.
         * @param {string} lockFilePath Path to lockfile that has to be created. Defaults to `<profile dir>/lockfile.lock`
         * @param {ILockFileOptions} lockFileOpts Options used for creating the lockfile.
         * @returns {Promise<T>}
         */
        executeActionWithLock<T>(action: () => Promise<T>, lockFilePath?: string, lockFileOpts?: ILockFileOptions): Promise<T>
        // TODO: expose as decorator
    }
}