import { LoggingEvent } from "log4js";
import { LoggerConfigData } from "../../../constants";

function cliAppender(layout: Function) {
	const appender = (loggingEvent: LoggingEvent) => {
		if (loggingEvent && loggingEvent.data) {
			const stream = loggingEvent.context[LoggerConfigData.useStderr] ? process.stderr : process.stdout;
			const preparedData = layout(loggingEvent);
			stream.write(preparedData);
		}
	};

	return appender;
}

function configure(config: Log4JSEmitAppenderConfiguration, layouts: any) {
	// the default layout for the appender
	let layout = layouts.messagePassThroughLayout;

	// check if there is another layout specified
	if (config.layout) {
		layout = layouts.layout(config.layout.type, config.layout);
	}

	// create a new appender instance
	return cliAppender(layout);
}

exports.configure = configure;
