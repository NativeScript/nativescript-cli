import { EOL } from "os";

export class AnalyticsLoggingService implements IAnalyticsLoggingService {
	constructor(private $fs: IFileSystem,
		private logFile: string) { }

	public logData(analyticsLoggingMessage: IAnalyticsLoggingMessage): void {
		if (this.logFile && analyticsLoggingMessage && analyticsLoggingMessage.message) {
			analyticsLoggingMessage.type = analyticsLoggingMessage.type || AnalyticsLoggingMessageType.Info;
			const formattedDate = this.getFormattedDate();
			this.$fs.appendFile(this.logFile, `[${formattedDate}] [${analyticsLoggingMessage.type}] ${analyticsLoggingMessage.message}${EOL}`);
		}
	}

	private getFormattedDate(): string {
		const currentDate = new Date();
		const year = currentDate.getFullYear();
		const month = this.getFormattedDateComponent((currentDate.getMonth() + 1));
		const day = this.getFormattedDateComponent(currentDate.getDate());
		const hour = this.getFormattedDateComponent(currentDate.getHours());
		const minutes = this.getFormattedDateComponent(currentDate.getMinutes());
		const seconds = this.getFormattedDateComponent(currentDate.getSeconds());
		const milliseconds = this.getFormattedMilliseconds(currentDate);

		return `${[year, month, day].join('-')} ${[hour, minutes, seconds].join(":")}.${milliseconds}`;
	}

	private getFormattedDateComponent(component: number): string {
		const stringComponent = component.toString();
		return stringComponent.length === 1 ? `0${stringComponent}` : stringComponent;
	}

	private getFormattedMilliseconds(date: Date): string {
		let milliseconds = date.getMilliseconds().toString();
		while (milliseconds.length < 3) {
			milliseconds = `0${milliseconds}`;
		}

		return milliseconds;
	}
}
