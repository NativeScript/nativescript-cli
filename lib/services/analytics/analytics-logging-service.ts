import { EOL } from "os";
import { getFixedLengthDateString } from "../../common/helpers";

export class AnalyticsLoggingService implements IAnalyticsLoggingService {
	constructor(private $fs: IFileSystem,
		private logFile: string) { }

	public logData(analyticsLoggingMessage: IAnalyticsLoggingMessage): void {
		if (this.logFile && analyticsLoggingMessage && analyticsLoggingMessage.message) {
			analyticsLoggingMessage.type = analyticsLoggingMessage.type || AnalyticsLoggingMessageType.Info;
			const formattedDate = getFixedLengthDateString();
			this.$fs.appendFile(this.logFile, `[${formattedDate}] [${analyticsLoggingMessage.type}] ${analyticsLoggingMessage.message}${EOL}`);
		}
	}
}
