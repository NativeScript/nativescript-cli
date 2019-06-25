/* tslint:disable:no-empty */

import * as util from "util";
import { EventEmitter } from "events";
import { LoggerConfigData } from "../../../constants";

export class LockServiceStub implements ILockService {
	public async lock(lockFilePath?: string, lockOpts?: ILockOptions): Promise<() => void> {
		return () => { };
	}

	public async unlock(lockFilePath?: string): Promise<void> {
	}

	public async executeActionWithLock<T>(action: () => Promise<T>, lockFilePath?: string, lockOpts?: ILockOptions): Promise<T> {
		const result = await action();
		return result;
	}
}

export class CommonLoggerStub implements ILogger {
	initialize(opts?: ILoggerOptions): void { }
	initializeCliLogger(): void { }
	getLevel(): string { return undefined; }
	fatal(...args: any[]): void { }
	error(...args: any[]): void { }
	warn(...args: any[]): void {
		this.output += util.format.apply(null, args) + "\n";
	}
	info(...args: any[]): void {
		this.output += util.format.apply(null, args) + "\n";
	}
	debug(...args: any[]): void { }
	trace(...args: any[]): void {
		this.traceOutput += util.format.apply(null, args) + "\n";
	}

	public output = "";
	public traceOutput = "";

	prepare(item: any): string {
		return "";
	}

	printMarkdown(message: string): void {
		this.output += message;
	}

	out(formatStr?: any, ...args: any[]): void { }
	write(...args: any[]): void { }
	printInfoMessageOnSameLine(message: string): void { }
	async printMsgWithTimeout(message: string, timeout: number): Promise<void> { }
	printOnStderr(formatStr?: any, ...args: any[]): void { }
	isVerbose(): boolean { return false; }
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

export class DeviceLogProviderStub extends EventEmitter implements Mobile.IDeviceLogProvider {
	public logger = new CommonLoggerStub();
	public currentDevicePids: IStringDictionary = {};
	public currentDeviceProjectNames: IStringDictionary = {};
	public currentDeviceProjectDirs: IStringDictionary = {};

	async setSourceFileLocation(pathToSourceFile: string): Promise<void> {
	}

	logData(line: string, platform: string, deviceIdentifier: string): void {
		this.logger.info(line, platform, deviceIdentifier, { [LoggerConfigData.skipNewLine]: true });
	}

	setLogLevel(level: string, deviceIdentifier?: string): void {
	}

	setApplicationPidForDevice(deviceIdentifier: string, pid: string): void {
		this.currentDevicePids[deviceIdentifier] = pid;
	}

	setProjectNameForDevice(deviceIdentifier: string, projectName: string): void {
		this.currentDeviceProjectNames[deviceIdentifier] = projectName;
	}

	setProjectDirForDevice(deviceIdentifier: string, projectDir: string): void {
		this.currentDeviceProjectDirs[deviceIdentifier] = projectDir;
	}
}
