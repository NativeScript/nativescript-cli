import { IShouldDispose, IDisposable } from "../common/declarations";
import {
	ISpawnCommandInfo,
	IJSCommand,
} from "../detached-processes/cleanup-process-definitions";

/**
 * Descibes the cleanup service which allows scheduling cleanup actions
 * The actions will be executed once CLI process exits.
 */
interface ICleanupService extends IShouldDispose, IDisposable {
	/**
	 * Add new action to be executed when CLI process exits.
	 * @param {ISpawnCommandInfo} commandInfo The command that should be executed, including command and args.
	 * @returns {Promise<void>}
	 */
	addCleanupCommand(commandInfo: ISpawnCommandInfo): Promise<void>;

	/**
	 * Remove action to be executed when CLI process exits.
	 * NOTE: The action should be added in the action list by calling `addCleanupAction` first.
	 * @param {ISpawnCommandInfo} commandInfo The command that should be removed from cleanup execution, including command and args.
	 * @returns {Promise<void>}
	 */
	removeCleanupCommand(commandInfo: ISpawnCommandInfo): Promise<void>;

	/**
	 * Sets the file in which the cleanup process will write its logs.
	 * This method must be called before starting the cleanup process, i.e. when CLI is initialized.
	 * @param {string} filePath Path to file where the logs will be written. The logs are appended to the passed file.
	 * @returns {void}
	 */
	setCleanupLogFile(filePath: string): void;

	/**
	 * Adds file/dir to be deleted once CLI process exits.
	 * @param {string} filePath Path to file/directory to be deleted.
	 * @returns {Promise<void>}
	 */
	addCleanupDeleteAction(filePath: string): Promise<void>;

	/**
	 * Removes file/dir from the list of files to be deleted once CLI process exits.
	 * NOTE: The file should be first added with `addCleanupDeleteAction`
	 * @param {string} filePath Path to file/directory to be removed from the list of files to be deleted.
	 * @returns {Promise<void>}
	 */
	removeCleanupDeleteAction(filePath: string): Promise<void>;

	/**
	 * Adds JS file to be required and executed during cleanup.
	 * NOTE: The JS file will be required in a new child process, so you can pass timeout for the execution.
	 * In the child process you can use all injected dependencies of CLI.
	 * @param {IJSCommand} jsCommand Information about the JS file to be required and the data that should be passed to it.
	 * @returns {Promise<void>}
	 */
	addCleanupJS(jsCommand: IJSCommand): Promise<void>;

	/**
	 * Removes JS file to be required and executed during cleanup.
	 * @param {IJSCommand} filePath jsCommand Information about the JS file to be required and the data that should not be passed to it.
	 * @returns {Promise<void>}
	 */
	removeCleanupJS(jsCommand: IJSCommand): Promise<void>;

	/**
	 * Adds a kill action for the process
	 * @param pid the pid of the process to be killed
	 * @returns {Promise<void>}
	 */
	addKillProcess(pid: string): Promise<void>;

	/**
	 * Removes the kill action for the process
	 * @param pid the pid of the process to be killed
	 * @returns {Promise<void>}
	 */
	removeKillProcess(pid: string): Promise<void>;
}
