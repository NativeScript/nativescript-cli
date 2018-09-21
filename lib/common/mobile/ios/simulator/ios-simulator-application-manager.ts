import { ApplicationManagerBase } from "../../application-manager-base";
import * as path from "path";
import * as temp from "temp";
import { hook, getPidFromiOSSimulatorLogs } from "../../../helpers";
import { cache } from "../../../decorators";

export class IOSSimulatorApplicationManager extends ApplicationManagerBase {
	constructor(private iosSim: any,
		private device: Mobile.IiOSDevice,
		private $options: ICommonOptions,
		private $fs: IFileSystem,
		private $plistParser: IPlistParser,
		private $deviceLogProvider: Mobile.IDeviceLogProvider,
		$logger: ILogger,
		$hooksService: IHooksService) {
		super($logger, $hooksService);
	}

	public async getInstalledApplications(): Promise<string[]> {
		return this.iosSim.getInstalledApplications(this.device.deviceInfo.identifier);
	}

	@hook('install')
	public async installApplication(packageFilePath: string): Promise<void> {
		if (this.$fs.exists(packageFilePath) && path.extname(packageFilePath) === ".zip") {
			temp.track();
			const dir = temp.mkdirSync("simulatorPackage");
			await this.$fs.unzip(packageFilePath, dir);
			const app = _.find(this.$fs.readDirectory(dir), directory => path.extname(directory) === ".app");
			if (app) {
				packageFilePath = path.join(dir, app);
			}
		}

		return this.iosSim.installApplication(this.device.deviceInfo.identifier, packageFilePath);
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> {
		return this.iosSim.uninstallApplication(this.device.deviceInfo.identifier, appIdentifier);
	}

	public async startApplication(appData: Mobile.IApplicationData): Promise<void> {
		const launchResult = await this.iosSim.startApplication(this.device.deviceInfo.identifier, appData.appId);
		const pid = getPidFromiOSSimulatorLogs(appData.appId, launchResult);
		await this.setDeviceLogData(appData, pid);
	}

	public async stopApplication(appData: Mobile.IApplicationData): Promise<void> {
		return this.iosSim.stopApplication(this.device.deviceInfo.identifier, appData.appId, appData.projectName);
	}

	public async getApplicationInfo(applicationIdentifier: string): Promise<Mobile.IApplicationInfo> {
		let result: Mobile.IApplicationInfo = null;
		const plistContent = await this.getParsedPlistContent(applicationIdentifier);

		if (plistContent) {
			result = {
				applicationIdentifier,
				deviceIdentifier: this.device.deviceInfo.identifier,
				configuration: plistContent && plistContent.configuration
			};
		}

		return result;
	}

	public async isLiveSyncSupported(appIdentifier: string): Promise<boolean> {
		const plistContent = await this.getParsedPlistContent(appIdentifier);
		if (plistContent) {
			return !!plistContent && !!plistContent.IceniumLiveSyncEnabled;
		}

		return false;
	}

	public async getDebuggableApps(): Promise<Mobile.IDeviceApplicationInformation[]> {
		return [];
	}

	public async getDebuggableAppViews(appIdentifiers: string[]): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> {
		// Implement when we can find debuggable applications for iOS.
		return Promise.resolve(null);
	}

	private async getParsedPlistContent(appIdentifier: string): Promise<any> {
		if (! await this.isApplicationInstalled(appIdentifier)) {
			return null;
		}

		const applicationPath = await this.iosSim.getApplicationPath(this.device.deviceInfo.identifier, appIdentifier),
			pathToInfoPlist = path.join(applicationPath, "Info.plist");

		return this.$fs.exists(pathToInfoPlist) ? await this.$plistParser.parseFile(pathToInfoPlist) : null;
	}

	private async setDeviceLogData(appData: Mobile.IApplicationData, pid: string): Promise<void> {
		this.$deviceLogProvider.setApplicationPidForDevice(this.device.deviceInfo.identifier, pid);
		this.$deviceLogProvider.setProjectNameForDevice(this.device.deviceInfo.identifier, appData.projectName);

		if (!this.$options.justlaunch) {
			await this.startDeviceLog();
		}
	}

	@cache()
	private startDeviceLog(): Promise<void> {
		return this.device.openDeviceLogStream({predicate: 'senderImagePath contains "NativeScript"'});
	}
}
