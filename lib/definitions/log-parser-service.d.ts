interface ILogParserService extends NodeJS.EventEmitter {
	/**
	 * Starts looking for debugger port. Attaches on device logs and processes them. In case when port is found, DEBUGGER_PORT_FOUND event is emitted.
	 * @param {Mobile.IDevice} device - Describes the device which logs will be processed.
	 */
	addParseRule(rule: ILogParseRule): void;
}

interface ILogParseRule {
	regex: RegExp;
	handler: Function;
	name: string;
	platform?: string;
}
