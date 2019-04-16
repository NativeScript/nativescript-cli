/**
 * Describes message that needs to be logged in the analytics logging file.
 */
interface IFileLogMessage {
	message: string;
	type?: FileLogMessageType;
}

/**
 * Describes methods to get local logs from analytics tracking.
 */
interface IFileLogService {
	/**
	 * Logs specified message to the previously specified file.
	 * @param {IFileLogMessage} fileLogMessage The message that has to be written to the logs file.
	 * @returns {void}
	 */
	logData(fileLogMessage: IFileLogMessage): void;
}
