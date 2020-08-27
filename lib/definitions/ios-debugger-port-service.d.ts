interface IIOSDebuggerPortInputData {
	deviceId: string;
	appId: string;
}

interface IIOSDebuggerPortData {
	port: number;
	deviceId: string;
	appId: string;
}

interface IIOSDebuggerPortStoredData {
	port: number;
	timer?: NodeJS.Timer;
	error?: Error;
}

interface IIOSDebuggerPortService {
	/**
	 * Gets iOS debugger port for specified deviceId and appId
	 * @param {IIOSDebuggerPortInputData} data - Describes deviceId and appId
	 */
	getPort(data: IIOSDebuggerPortInputData): Promise<number>;
	/**
	 * Attaches on DEBUGGER_PORT_FOUND event and stores the port
	 * @returns {Promise<void>}
	 */
	attachToDebuggerPortFoundEvent(appId: string): Promise<void>;
}
