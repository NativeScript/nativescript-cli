/* tslint:disable:no-empty */

import * as util from "util";

export class CommonLoggerStub implements ILogger {
	setLevel(level: string): void { }
	getLevel(): string { return undefined; }
	fatal(...args: string[]): void { }
	error(...args: string[]): void { }
	warn(...args: string[]): void {
		this.out.apply(this, args);
	}
	warnWithLabel(...args: string[]): void { }
	info(...args: string[]): void {
		this.out.apply(this, args);
	}
	debug(...args: string[]): void { }
	trace(...args: string[]): void {
		this.traceOutput += util.format.apply(null, args) + "\n";
	}

	public output = "";
	public traceOutput = "";

	out(...args: string[]): void {
		this.output += util.format.apply(null, args) + "\n";
	}

	write(...args: string[]): void { }

	prepare(item: any): string {
		return "";
	}

	printInfoMessageOnSameLine(message: string): void { }
	async printMsgWithTimeout(message: string, timeout: number): Promise<void> {
		return null;
	}

	printMarkdown(message: string): void {
		this.output += message;
	}
}

export class ErrorsStub implements IErrors {
	printCallStack: boolean = false;

	fail(formatStr: string, ...args: any[]): never;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): never;

	fail(...args: any[]): never {
		if (_.isObject(args) && (<any>args).formatStr) {
			throw new Error((<any>args).formatStr);
		}

		throw new Error(util.format.apply(null, args));
	}

	failWithoutHelp(message: string, ...args: any[]): never {
		throw new Error(message);
	}

	async beginCommand(action: () => Promise<boolean>, printHelpCommand: () => Promise<void>): Promise<boolean> {
		return action();
	}

	executeAction(action: Function): any {
		return action();
	}

	verifyHeap(message: string): void { }
}

export class HooksServiceStub implements IHooksService {
	async executeBeforeHooks(commandName: string): Promise<void> {
		return;
	}
	async executeAfterHooks(commandName: string): Promise<void> {
		return;
	}

	hookArgsName = "hookArgs";
}

export class SettingsService implements ISettingsService {
	public setSettings(settings: IConfigurationSettings) {
		// Intentionally left blank
	}

	public getProfileDir() {
		return "profileDir";
	}
}

export class AndroidProcessServiceStub implements Mobile.IAndroidProcessService {
	public MapAbstractToTcpPortResult = "stub";
	public GetDebuggableAppsResult: Mobile.IDeviceApplicationInformation[] = [];
	public GetMappedAbstractToTcpPortsResult: IDictionary<number> = {};
	public GetAppProcessIdResult = "stub";
	public GetAppProcessIdFailAttempts = 0;
	public ForwardFreeTcpToAbstractPortResult = 0;

	async mapAbstractToTcpPort(deviceIdentifier: string, appIdentifier: string, framework: string): Promise<string> {
		return this.MapAbstractToTcpPortResult;
	}
	async getDebuggableApps(deviceIdentifier: string): Promise<Mobile.IDeviceApplicationInformation[]> {
		return this.GetDebuggableAppsResult;
	}
	async getMappedAbstractToTcpPorts(deviceIdentifier: string, appIdentifiers: string[], framework: string): Promise<IDictionary<number>> {
		return this.GetMappedAbstractToTcpPortsResult;
	}
	async getAppProcessId(deviceIdentifier: string, appIdentifier: string): Promise<string> {
		while (this.GetAppProcessIdFailAttempts) {
			this.GetAppProcessIdFailAttempts--;
			return null;
		}

		return this.GetAppProcessIdResult;
	}
	async forwardFreeTcpToAbstractPort(portForwardInputData: Mobile.IPortForwardData): Promise<number> {
		return this.ForwardFreeTcpToAbstractPortResult;
	}
}

export class LogcatHelperStub implements Mobile.ILogcatHelper {
	public StopCallCount = 0;
	public StartCallCount = 0;
	public DumpCallCount = 0;
	public LastStartCallOptions: Mobile.ILogcatStartOptions = {
		deviceIdentifier: ""
	};
	public LastStopDeviceId = "";

	async start(options: Mobile.ILogcatStartOptions): Promise<void> {
		this.LastStartCallOptions = options;
		this.StartCallCount++;
	}

	stop(deviceIdentifier: string): void {
		this.LastStopDeviceId = deviceIdentifier;
		this.StopCallCount++;
	}
	dump(): Promise<void> {
		this.DumpCallCount++;
		return Promise.resolve();
	}
}

export class DeviceLogProviderStub implements Mobile.IDeviceLogProvider {
	public logger = new CommonLoggerStub();
	public currentDevicePids: IStringDictionary = {};
	public currentDeviceProjectNames: IStringDictionary = {};

	logData(line: string, platform: string, deviceIdentifier: string): void {
		this.logger.write(line, platform, deviceIdentifier);
	}

	setLogLevel(level: string, deviceIdentifier?: string): void {
		this.logger.setLevel(level);
	}

	setApplicationPidForDevice(deviceIdentifier: string, pid: string): void {
		this.currentDevicePids[deviceIdentifier] = pid;
	}

	setProjectNameForDevice(deviceIdentifier: string, projectName: string): void {
		this.currentDeviceProjectNames[deviceIdentifier] = projectName;
	}
}
