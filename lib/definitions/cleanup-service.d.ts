/**
 * Descibes the cleanup service which allows scheduling cleanup actions
 * The actions will be executed once CLI process exits.
 */
interface ICleanupService extends IShouldDispose, IDisposable {
	/**
	 * Add new action to be executed when CLI process exits.
	 * @param {ICleanupAction} action The action that should be executed, including command and args.
	 * @returns {Promise<void>}
	 */
	addCleanupAction(action: ICleanupAction): Promise<void>;

	/**
	 * Sets the file in which the cleanup process will write its logs.
	 * This method must be called before starting the cleanup process, i.e. when CLI is initialized.
	 * @param {string} filePath Path to file where the logs will be written. The logs are appended to the passed file.
	 * @returns {void}
	 */
	setCleanupLogFile(filePath: string): void
}
