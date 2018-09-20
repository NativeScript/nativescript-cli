interface IEqatecLogging {
	logMessage(...args: string[]): void;
	logError(...args: string[]): void;
}

interface IEqatecSettings {
	useHttps: boolean;
	userAgent: string;
	version: string;
	useCookies: boolean;
	loggingInterface: IEqatecLogging;
}

interface IEqatecMonitor {
	trackFeature(featureNameAndValue: string): void;
	trackException(exception: Error, message: string): void;
	stop(): void;
	setInstallationID(guid: string): void;
	setUserID(userId: string): void;
	setStartCount(count: number): void;
	start(): void;
	status(): { isSending: boolean };
}

interface IEqatec {
	createSettings(analyticsProjectKey: string): IEqatecSettings;
	createMonitor(settings: IEqatecSettings): IEqatecMonitor;
}