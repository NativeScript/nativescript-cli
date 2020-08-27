import { EOL } from "os";
import { getFixedLengthDateString } from "../common/helpers";
import { IFileSystem } from "../common/declarations";

export class FileLogService implements IFileLogService {
	constructor(private $fs: IFileSystem, private logFile: string) {}

	public logData(fileLoggingMessage: IFileLogMessage): void {
		if (this.logFile && fileLoggingMessage && fileLoggingMessage.message) {
			fileLoggingMessage.type =
				fileLoggingMessage.type || FileLogMessageType.Info;
			const formattedDate = getFixedLengthDateString();
			this.$fs.appendFile(
				this.logFile,
				`[${formattedDate}] [${fileLoggingMessage.type}] ${fileLoggingMessage.message}${EOL}`
			);
		}
	}
}
