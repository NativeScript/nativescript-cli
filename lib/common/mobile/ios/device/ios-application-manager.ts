import { EOL } from "os";
import * as _ from "lodash";
import { hook } from "../../../helpers";
import { ApplicationManagerBase } from "../../application-manager-base";
import { cache } from "../../../decorators";
import { IOptions } from "../../../../declarations";
import { ChildProcess } from "child_process";
import {
	IChildProcess,
	IHooksService,
	IErrors,
	IiOSNotificationService,
	IDictionary,
} from "../../../declarations";

export class IOSApplicationManager extends ApplicationManagerBase {
	private static readonly LLDB_CONTINUE_TIMEOUT = 10000;
	private static readonly LLDB_EXIT_TIMEOUT = 3000;

	private applicationsLiveSyncInfos: Mobile.IApplicationInfo[];
	private lldbProcesses: IDictionary<ChildProcess> = {};

	constructor(
		protected $logger: ILogger,
		protected $hooksService: IHooksService,
		private device: Mobile.IiOSDevice,
		private $errors: IErrors,
		private $iOSNotificationService: IiOSNotificationService,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $options: IOptions,
		protected $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $childProcess: IChildProcess
	) {
		super($logger, $hooksService, $deviceLogProvider);
	}

	public async getInstalledApplications(): Promise<string[]> {
		const applicationsLiveSyncStatus = await this.getApplicationsInformation();

		return _(applicationsLiveSyncStatus)
			.map((appLiveSyncStatus) => appLiveSyncStatus.applicationIdentifier)
			.sortBy((identifier: string) => identifier.toLowerCase())
			.value();
	}

	@hook("install")
	public async installApplication(packageFilePath: string): Promise<void> {
		await this.$iosDeviceOperations.install(
			packageFilePath,
			[this.device.deviceInfo.identifier],
			(err: IOSDeviceLib.IDeviceError) => {
				this.$errors.fail(
					`Failed to install ${packageFilePath} on device with identifier ${err.deviceId}. Error is: ${err.message}`
				);
			}
		);
	}

	public async getApplicationsInformation(): Promise<
		Mobile.IApplicationInfo[]
	> {
		const deviceIdentifier = this.device.deviceInfo.identifier;
		const applicationsOnDeviceInfo = _.first(
			(await this.$iosDeviceOperations.apps([deviceIdentifier]))[
				deviceIdentifier
			]
		);
		const applicationsOnDevice = applicationsOnDeviceInfo
			? applicationsOnDeviceInfo.response
			: [];
		this.$logger.trace(
			"Result when getting applications information: ",
			JSON.stringify(applicationsOnDevice, null, 2)
		);

		this.applicationsLiveSyncInfos = _.map(applicationsOnDevice, (app) => ({
			applicationIdentifier: app.CFBundleIdentifier,
			configuration: app.configuration,
			deviceIdentifier: this.device.deviceInfo.identifier,
		}));

		return this.applicationsLiveSyncInfos;
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> {
		await this.$iosDeviceOperations.uninstall(
			appIdentifier,
			[this.device.deviceInfo.identifier],
			(err: IOSDeviceLib.IDeviceError) => {
				this.$logger.warn(
					`Failed to uninstall ${appIdentifier} on device with identifier ${err.deviceId}`
				);
			}
		);

		this.$logger.trace(
			"Application %s has been uninstalled successfully.",
			appIdentifier
		);
	}

	public async startApplication(
		appData: Mobile.IStartApplicationData
	): Promise<void> {
		if (!(await this.isApplicationInstalled(appData.appId))) {
			this.$errors.fail(
				"Invalid application id: %s. All available application ids are: %s%s ",
				appData.appId,
				EOL,
				this.applicationsLiveSyncInfos.join(EOL)
			);
		}

		await this.setDeviceLogData(appData);
		await this.runApplicationCore(appData);

		this.$logger.info(
			`Successfully run application ${appData.appId} on device with ID ${this.device.deviceInfo.identifier}.`
		);
	}

	public async stopApplication(
		appData: Mobile.IApplicationData
	): Promise<void> {
		const { appId } = appData;

		await this.device.destroyDebugSocket(appId);
		await this.detachNativeDebugger(appId);

		const action = () =>
			this.$iosDeviceOperations.stop([
				{
					deviceId: this.device.deviceInfo.identifier,
					ddi: this.$options.ddi,
					appId,
				},
			]);

		try {
			await action();
		} catch (err) {
			this.$logger.trace(
				`Error when trying to stop application ${appId} on device ${this.device.deviceInfo.identifier}: ${err}. Retrying stop operation.`
			);
			await action();
		}
	}

	public async restartApplication(
		appData: Mobile.IStartApplicationData
	): Promise<void> {
		try {
			await this.setDeviceLogData(appData);
			await this.stopApplication(appData);
			await this.runApplicationCore(appData);
		} catch (err) {
			await this.$iOSNotificationService.postNotification(
				this.device.deviceInfo.identifier,
				`${appData.appId}:NativeScript.LiveSync.RestartApplication`
			);
			throw err;
		}
	}

	private async setDeviceLogData(
		appData: Mobile.IApplicationData
	): Promise<void> {
		this.$deviceLogProvider.setProjectNameForDevice(
			this.device.deviceInfo.identifier,
			appData.projectName
		);
		this.$deviceLogProvider.setProjectDirForDevice(
			this.device.deviceInfo.identifier,
			appData.projectDir
		);
		if (!this.$options.justlaunch) {
			await this.startDeviceLog();
		}
	}

	private async runApplicationCore(
		appData: Mobile.IStartApplicationData
	): Promise<void> {
		await this.detachNativeDebugger(appData.appId);

		const deviceId = this.device.deviceInfo.identifier;
		const waitForDebugger = (!!appData.waitForDebugger).toString();
		const result = await this.$iosDeviceOperations.start([
			{
				deviceId,
				appId: appData.appId,
				ddi: this.$options.ddi,
				waitForDebugger,
			},
		]);

		const pid = result?.[deviceId]?.[0]?.pid;
		if (appData.waitForDebugger && pid > 0) {
			this.attachNativeDebugger(appData.appId, pid);
		}
	}

	// iOS kills an app that takes about 20 seconds to launch, which is what waiting
	// for or pausing in the JS debugger looks like, unless a native debugger is
	// attached. An lldb without the `device` commands (believed to need Xcode 16)
	// can't attach, which limits the wait to those 20 seconds.
	private attachNativeDebugger(appId: string, pid: number): void {
		// Its own process group keeps Ctrl-C from reaching lldb, which would stop
		// the app. lldb still exits when the CLI does, as its stdin closes.
		const lldb = this.$childProcess.spawn("xcrun", ["lldb"], {
			detached: true,
		});
		this.lldbProcesses[appId] = lldb;
		lldb.on("error", (err: Error) => {
			this.$logger.trace("Unable to attach lldb to the application", err);
		});
		lldb.stdin?.on("error", (err: Error) => {
			this.$logger.trace("Unable to write to lldb", err);
		});

		// Attaching stops the app, and until it continues it can't answer the JS
		// debugger's attach request. The continue is sent once lldb reports the
		// stop, or after a timeout in case that report never shows up.
		let settled = false;
		const continueApp = () => lldb.stdin?.write("process continue\n");
		const fallback = setTimeout(
			continueApp,
			IOSApplicationManager.LLDB_CONTINUE_TIMEOUT
		);
		const done = () => {
			settled = true;
			clearTimeout(fallback);
		};
		lldb.on("close", done);
		lldb.on("error", done);

		const watch = (stream: NodeJS.ReadableStream) => {
			let output = "";
			stream?.on("data", (data: Buffer) => {
				this.$logger.trace(`${data}`);
				if (settled) {
					return;
				}
				output += data;
				const state = /Process \d+ (stopped|resuming)/.exec(output)?.[1];
				if (state) {
					done();
					if (state === "stopped") {
						continueApp();
					}
				}
			});
		};
		watch(lldb.stdout);
		watch(lldb.stderr);

		lldb.stdin?.write(
			`device select ${this.device.deviceInfo.identifier}\ndevice process attach -p ${pid}\n`
		);
	}

	// Stop the app only once lldb is gone, or lldb intercepts the termination
	// signal and leaves the app suspended.
	private async detachNativeDebugger(appId: string): Promise<void> {
		const lldb = this.lldbProcesses[appId];
		if (!lldb) {
			return;
		}
		delete this.lldbProcesses[appId];

		if (lldb.pid && lldb.exitCode === null && lldb.signalCode === null) {
			let timer: NodeJS.Timeout;
			await new Promise<void>((resolve) => {
				timer = setTimeout(() => {
					this.$logger.trace("lldb did not exit in time, killing it");
					lldb.kill();
					resolve();
				}, IOSApplicationManager.LLDB_EXIT_TIMEOUT);
				lldb.once("exit", () => resolve());
				lldb.stdin?.end("process detach\nquit\n");
			});
			clearTimeout(timer);
		}
	}

	@cache()
	private async startDeviceLog(): Promise<void> {
		await this.device.openDeviceLogStream();
	}

	public getDebuggableApps(): Promise<Mobile.IDeviceApplicationInformation[]> {
		// Implement when we can find debuggable applications for iOS.
		return Promise.resolve([]);
	}

	public getDebuggableAppViews(
		appIdentifiers: string[]
	): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> {
		// Implement when we can find debuggable applications for iOS.
		return Promise.resolve(null);
	}
}
