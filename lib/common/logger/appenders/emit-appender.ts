import { LoggingEvent } from "log4js";
import { EventEmitter } from "events";
import { EmitAppenderEventName } from "../../../constants";

function emitAppender(layout: Function, emitter: EventEmitter) {
	const appender = (loggingEvent: LoggingEvent) => {
		emitter.emit(EmitAppenderEventName, { loggingEvent, formattedMessage: layout(loggingEvent) });
	};

	appender.shutdown = () => {
		emitter.removeAllListeners(EmitAppenderEventName);
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

	if (!config.emitter) {
		throw new Error("Emitter must be passed to emit-appender");
	}

	if (!config.emitter.emit || typeof config.emitter.emit !== "function") {
		throw new Error("The passed emitter must be instance of EventEmitter");
	}

	// create a new appender instance
	return emitAppender(layout, config.emitter);
}

exports.configure = configure;
