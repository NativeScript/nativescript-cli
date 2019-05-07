import { format } from "util";
import { getMessageWithBorders } from "../../helpers";
import { LoggingEvent } from "log4js";
import { LoggerConfigData, LoggerLevel } from "../../../constants";
import { EOL } from "os";

export function layout(config: any) {
	return function (logEvent: LoggingEvent): string {
		let msg = format.apply(null, logEvent.data);

		if (logEvent.context[LoggerConfigData.wrapMessageWithBorders]) {
			msg = getMessageWithBorders(msg);
		}

		if (!logEvent.context[LoggerConfigData.skipNewLine]) {
			msg += EOL;
		}

		if (logEvent.level.isEqualTo(LoggerLevel.INFO)) {
			return msg;
		}

		if (logEvent.level.isEqualTo(LoggerLevel.ERROR)) {
			return msg.red.bold;
		}

		if (logEvent.level.isEqualTo(LoggerLevel.WARN)) {
			return msg.yellow;
		}

		return msg;
	};
}
