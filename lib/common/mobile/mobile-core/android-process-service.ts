import { EOL } from "os";
import * as shelljs from "shelljs";
import { DeviceAndroidDebugBridge } from "../android/device-android-debug-bridge";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../../constants";
import { exported, cache } from "../../decorators";

export class AndroidProcessService implements Mobile.IAndroidProcessService {
	private _devicesAdbs: IDictionary<Mobile.IDeviceAndroidDebugBridge>;
	private _forwardedLocalPorts: IDictionary<number>;

	constructor(private $errors: IErrors,
		private $injector: IInjector,
		private $net: INet,
		private $processService: IProcessService) {
		this._devicesAdbs = {};
		this._forwardedLocalPorts = {};
	}

	public async forwardFreeTcpToAbstractPort(portForwardInputData: Mobile.IPortForwardData): Promise<number> {
		const adb = await this.setupForPortForwarding(portForwardInputData);
		return this.forwardPort(portForwardInputData, adb);
	}

	public async mapAbstractToTcpPort(deviceIdentifier: string, appIdentifier: string, framework: string): Promise<string> {
		this.tryAttachToProcessExitSignals();

		const adb = await this.setupForPortForwarding({ deviceIdentifier, appIdentifier });

		const processId = (await this.getProcessIds(adb, [appIdentifier]))[appIdentifier];
		const applicationNotStartedErrorMessage = `The application is not started on the device with identifier ${deviceIdentifier}.`;

		if (!processId) {
			this.$errors.failWithoutHelp(applicationNotStartedErrorMessage);
		}

		const abstractPortsInformation = await this.getAbstractPortsInformation(adb);
		const abstractPort = await this.getAbstractPortForApplication(adb, processId, appIdentifier, abstractPortsInformation, framework);

		if (!abstractPort) {
			this.$errors.failWithoutHelp(applicationNotStartedErrorMessage);
		}

		const forwardedTcpPort = await this.forwardPort({ deviceIdentifier, appIdentifier, abstractPort: `localabstract:${abstractPort}` }, adb);
		return forwardedTcpPort && forwardedTcpPort.toString();
	}

	public async getMappedAbstractToTcpPorts(deviceIdentifier: string, appIdentifiers: string[], framework: string): Promise<IDictionary<number>> {
		const adb = this.getAdb(deviceIdentifier),
			abstractPortsInformation = await this.getAbstractPortsInformation(adb),
			processIds = await this.getProcessIds(adb, appIdentifiers),
			adbForwardList = await adb.executeCommand(["forward", "--list"]),
			localPorts: IDictionary<number> = {};

		await Promise.all(
			_.map(appIdentifiers, async appIdentifier => {
				localPorts[appIdentifier] = null;
				const processId = processIds[appIdentifier];

				if (!processId) {
					return;
				}

				const abstractPort = await this.getAbstractPortForApplication(adb, processId, appIdentifier, abstractPortsInformation, framework);

				if (!abstractPort) {
					return;
				}

				const localPort = await this.getAlreadyMappedPort(adb, deviceIdentifier, abstractPort, adbForwardList);

				if (localPort) {
					localPorts[appIdentifier] = localPort;
				}
			}));

		return localPorts;
	}

	public async getDebuggableApps(deviceIdentifier: string): Promise<Mobile.IDeviceApplicationInformation[]> {
		const adb = this.getAdb(deviceIdentifier);
		const androidWebViewPortInformation = (await this.getAbstractPortsInformation(adb)).split(EOL);

		// TODO: Add tests and make sure only unique names are returned. Input before groupBy is:
		// [ { deviceIdentifier: 'SH26BW100473',
		// 	appIdentifier: 'com.telerik.EmptyNS',
		// 	framework: 'NativeScript' },
		// 	{ deviceIdentifier: 'SH26BW100473',
		// 	appIdentifier: 'com.telerik.EmptyNS',
		// 	framework: 'Cordova' },
		// 	{ deviceIdentifier: 'SH26BW100473',
		// 	appIdentifier: 'chrome',
		// 	framework: 'Cordova' },
		// 	{ deviceIdentifier: 'SH26BW100473',
		// 	appIdentifier: 'chrome',
		// 	framework: 'Cordova' } ]
		const portInformation = await Promise.all(
			_.map(androidWebViewPortInformation, async line => await this.getApplicationInfoFromWebViewPortInformation(adb, deviceIdentifier, line)
				|| await this.getNativeScriptApplicationInformation(adb, deviceIdentifier, line)
			)
		);

		return _(portInformation)
			.filter(deviceAppInfo => !!deviceAppInfo)
			.groupBy(element => element.framework)
			.map((group: Mobile.IDeviceApplicationInformation[]) => _.uniqBy(group, g => g.appIdentifier))
			.flatten<Mobile.IDeviceApplicationInformation>()
			.value();
	}

	@exported("androidProcessService")
	public async getAppProcessId(deviceIdentifier: string, appIdentifier: string): Promise<string> {
		const adb = this.getAdb(deviceIdentifier);
		const processId = (await this.getProcessIds(adb, [appIdentifier]))[appIdentifier];

		return processId ? processId.toString() : null;
	}

	private async forwardPort(portForwardInputData: Mobile.IPortForwardData, adb: Mobile.IDeviceAndroidDebugBridge): Promise<number> {
		let localPort = await this.getAlreadyMappedPort(adb, portForwardInputData.deviceIdentifier, portForwardInputData.abstractPort);

		if (!localPort) {
			localPort = await this.$net.getFreePort();
			await adb.executeCommand(["forward", `tcp:${localPort}`, portForwardInputData.abstractPort], {deviceIdentifier: portForwardInputData.deviceIdentifier});
		}

		this._forwardedLocalPorts[portForwardInputData.deviceIdentifier] = localPort;
		return localPort && +localPort;
	}

	private async setupForPortForwarding(portForwardInputData?: Mobile.IPortForwardDataBase): Promise<Mobile.IDeviceAndroidDebugBridge> {
		this.tryAttachToProcessExitSignals();

		const adb = this.getAdb(portForwardInputData.deviceIdentifier);

		return adb;
	}

	private async getApplicationInfoFromWebViewPortInformation(adb: Mobile.IDeviceAndroidDebugBridge, deviceIdentifier: string, information: string): Promise<Mobile.IDeviceApplicationInformation> {
		// Need to search by processId to check for old Android webviews (@webview_devtools_remote_<processId>).
		const processIdRegExp = /@webview_devtools_remote_(.+)/g;
		const processIdMatches = processIdRegExp.exec(information);
		let cordovaAppIdentifier: string;

		if (processIdMatches) {
			const processId = processIdMatches[1];
			cordovaAppIdentifier = await this.getApplicationIdentifierFromPid(adb, processId);
		} else {
			// Search for appIdentifier (@<appIdentifier>_devtools_remote).
			const chromeAppIdentifierRegExp = /@(.+)_devtools_remote\s?/g;
			const chromeAppIdentifierMatches = chromeAppIdentifierRegExp.exec(information);

			if (chromeAppIdentifierMatches && chromeAppIdentifierMatches.length > 0) {
				cordovaAppIdentifier = chromeAppIdentifierMatches[1];
			}
		}

		if (cordovaAppIdentifier) {
			return {
				deviceIdentifier: deviceIdentifier,
				appIdentifier: cordovaAppIdentifier,
				framework: TARGET_FRAMEWORK_IDENTIFIERS.Cordova
			};
		}

		return null;
	}

	private async getNativeScriptApplicationInformation(adb: Mobile.IDeviceAndroidDebugBridge, deviceIdentifier: string, information: string): Promise<Mobile.IDeviceApplicationInformation> {
		// Search for appIdentifier (@<appIdentifier-debug>).
		const nativeScriptAppIdentifierRegExp = /@(.+)-(debug|inspectorServer)/g;
		const nativeScriptAppIdentifierMatches = nativeScriptAppIdentifierRegExp.exec(information);

		if (nativeScriptAppIdentifierMatches && nativeScriptAppIdentifierMatches.length > 0) {
			const appIdentifier = nativeScriptAppIdentifierMatches[1];
			return {
				deviceIdentifier: deviceIdentifier,
				appIdentifier: appIdentifier,
				framework: TARGET_FRAMEWORK_IDENTIFIERS.NativeScript
			};
		}

		return null;
	}

	private async getAbstractPortForApplication(adb: Mobile.IDeviceAndroidDebugBridge, processId: string | number, appIdentifier: string, abstractPortsInformation: string, framework: string): Promise<string> {
		// The result will look like this (without the columns names):
		// Num       		 RefCount Protocol Flags    Type St Inode  Path
		// 0000000000000000: 00000002 00000000 00010000 0001 01 189004 @webview_devtools_remote_25512
		// The Path column is the abstract port.

		framework = framework || "";

		switch (framework.toLowerCase()) {
			case TARGET_FRAMEWORK_IDENTIFIERS.Cordova.toLowerCase():
				return this.getCordovaPortInformation(abstractPortsInformation, appIdentifier, processId);
			case TARGET_FRAMEWORK_IDENTIFIERS.NativeScript.toLowerCase():
				return this.getNativeScriptPortInformation(abstractPortsInformation, appIdentifier);
			default:
				return this.getCordovaPortInformation(abstractPortsInformation, appIdentifier, processId) ||
					this.getNativeScriptPortInformation(abstractPortsInformation, appIdentifier);
		}
	}

	private getCordovaPortInformation(abstractPortsInformation: string, appIdentifier: string, processId: string | number): string {
		return this.getPortInformation(abstractPortsInformation, `${appIdentifier}_devtools_remote`) || this.getPortInformation(abstractPortsInformation, processId);
	}

	private getNativeScriptPortInformation(abstractPortsInformation: string, appIdentifier: string): string {
		return this.getPortInformation(abstractPortsInformation, `${appIdentifier}-debug`);
	}

	private async getAbstractPortsInformation(adb: Mobile.IDeviceAndroidDebugBridge): Promise<string> {
		return adb.executeShellCommand(["cat", "/proc/net/unix"]);
	}

	private getPortInformation(abstractPortsInformation: string, searchedInfo: string | number): string {
		const processRegExp = new RegExp(`\\w+:\\s+(?:\\w+\\s+){1,6}@(.*?${searchedInfo})$`, "gm");

		const match = processRegExp.exec(abstractPortsInformation);
		return match && match[1];
	}

	private async getProcessIds(adb: Mobile.IDeviceAndroidDebugBridge, appIdentifiers: string[]): Promise<IDictionary<number>> {
		// Process information will look like this (without the columns names):
		// USER     PID   PPID  VSIZE   RSS   WCHAN    PC         NAME
		// u0_a63   25512 1334  1519560 96040 ffffffff f76a8f75 S com.telerik.appbuildertabstest
		const result: IDictionary<number> = {};
		const processIdInformation: string = await adb.executeShellCommand(["ps"]);
		_.each(appIdentifiers, appIdentifier => {
			const processIdRegExp = new RegExp(`^\\w*\\s*(\\d+).*?${appIdentifier}$`);
			result[appIdentifier] = this.getFirstMatchingGroupFromMultilineResult<number>(processIdInformation, processIdRegExp);
		});

		return result;
	}

	private async getAlreadyMappedPort(adb: Mobile.IDeviceAndroidDebugBridge, deviceIdentifier: string, abstractPort: string, adbForwardList?: any): Promise<number> {
		const allForwardedPorts: string = adbForwardList || await adb.executeCommand(["forward", "--list"]) || "";

		// Sample output:
		// 5e2e580b tcp:62503 localabstract:webview_devtools_remote_7985
		// 5e2e580b tcp:62524 localabstract:webview_devtools_remote_7986
		// 5e2e580b tcp:63160 localabstract:webview_devtools_remote_7987
		// 5e2e580b tcp:57577 localabstract:com.telerik.nrel-debug
		const regex = new RegExp(`${deviceIdentifier}\\s+?tcp:(\\d+?)\\s+?.*?${abstractPort}$`);

		return this.getFirstMatchingGroupFromMultilineResult<number>(allForwardedPorts, regex);
	}

	private getAdb(deviceIdentifier: string): Mobile.IDeviceAndroidDebugBridge {
		if (!this._devicesAdbs[deviceIdentifier]) {
			this._devicesAdbs[deviceIdentifier] = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: deviceIdentifier });
		}

		return this._devicesAdbs[deviceIdentifier];
	}

	private async getApplicationIdentifierFromPid(adb: Mobile.IDeviceAndroidDebugBridge, pid: string, psData?: string): Promise<string> {
		psData = psData || await adb.executeShellCommand(["ps"]);
		// Process information will look like this (without the columns names):
		// USER     PID   PPID  VSIZE   RSS   WCHAN    PC         NAME
		// u0_a63   25512 1334  1519560 96040 ffffffff f76a8f75 S com.telerik.appbuildertabstest
		return this.getFirstMatchingGroupFromMultilineResult<string>(psData, new RegExp(`\\s+${pid}(?:\\s+\\d+){3}\\s+.*\\s+(.*?)$`));
	}

	private getFirstMatchingGroupFromMultilineResult<T>(input: string, regex: RegExp): T {
		let result: T;

		_((input || "").split('\n'))
			.map(line => line.trim())
			.filter(line => !!line)
			.each(line => {
				const matches = line.match(regex);
				if (matches && matches[1]) {
					result = <any>matches[1];
					return false;
				}
			});

		return result;
	}

	@cache()
	private tryAttachToProcessExitSignals(): void {
		this.$processService.attachToProcessExitSignals(this, () => {
			_.each(this._forwardedLocalPorts, (port: number, deviceIdentifier: string) => {
				// We need to use shelljs here instead of $adb because listener functions of exit, SIGINT and SIGTERM must only perform synchronous operations.
				// The Node.js process will exit immediately after calling the 'exit' event listeners causing any additional work still queued in the event loop to be abandoned.
				// See the official documentation for more information and examples - https://nodejs.org/dist/latest-v6.x/docs/api/process.html#process_event_exit.
				shelljs.exec(`adb -s ${deviceIdentifier} forward --remove tcp:${port}`);
			});
		});
	}
}

$injector.register("androidProcessService", AndroidProcessService);
