interface IIOSDebuggerPortInputData {
	deviceId: string;
	appId: string;
}

interface IIOSDebuggerPortData {
	port: number,
	deviceId: string;
	appId: string;
}

interface IIOSDebuggerPortStoredData {
	port: number;
	timer?: NodeJS.Timer;
}

interface IIOSDebuggerPortService {
	/**
	 * Gets iOS debugger port for specified deviceId and appId
	 * @param {IIOSDebuggerPortInputData} data - Describes deviceId and appId
	 */
	getPort(data: IIOSDebuggerPortInputData, debugOptions?: IDebugOptions): Promise<number>;
	/**
	 * Attaches on DEBUGGER_PORT_FOUND event and STARTING_IOS_APPLICATION events
	 * In case when DEBUGGER_PORT_FOUND event is emitted, stores the port and clears the timeout if such.
	 * In case when STARTING_IOS_APPLICATION event is emitted, sets the port to null and add timeout for 10000 miliseconds which checks if port is null and prints a warning.
	 * @param {Mobile.IDevice} device - Describes the device which logs should be parsed.
	 * @param {IProjectDir} data - Object that has a projectDir property.
	 * @param {IDebugOptions} debugOptions
	 * @returns {Promise<void>}
	 */
	attachToDebuggerPortFoundEvent(device: Mobile.IDevice, data: IProjectDir, debugOptions: IDebugOptions): Promise<void>;
}