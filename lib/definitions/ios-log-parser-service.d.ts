interface IIOSLogParserService extends NodeJS.EventEmitter {
	/**
	 * Starts looking for debugger port. Attaches on device logs and processes them. In case when port is found, DEBUGGER_PORT_FOUND event is emitted.
	 * @param {Mobile.IDevice} device - Describes the device which logs will be processed.
	 */
	startLookingForDebuggerPort(device: Mobile.IDevice): void;
}
