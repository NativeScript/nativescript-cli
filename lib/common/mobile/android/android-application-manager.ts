import { EOL } from "os";
import { ApplicationManagerBase } from "../application-manager-base";
import { TARGET_FRAMEWORK_IDENTIFIERS, LiveSyncPaths } from "../../constants";
import { hook, sleep, regExpEscape } from "../../helpers";
import { cache } from "../../decorators";
import { parse, join } from "path";
import * as _ from "lodash";
import { AAB_EXTENSION_NAME, APKS_EXTENSION_NAME } from "../../../constants";
import { IOptions } from "../../../declarations";
import {
	IAndroidBuildData,
	IAndroidSigningData,
} from "../../../definitions/build";
import { IAndroidBundleToolService } from "../../../definitions/android-bundle-tool-service";
import {
	IFileSystem,
	Server,
	IErrors,
	IHooksService,
	IDictionary,
} from "../../declarations";

export class AndroidApplicationManager extends ApplicationManagerBase {
	public PID_CHECK_INTERVAL = 100;
	public PID_CHECK_TIMEOUT = 10000; // 10 secs

	constructor(
		private adb: Mobile.IDeviceAndroidDebugBridge,
		private identifier: string,
		private $androidBundleToolService: IAndroidBundleToolService,
		private $fs: IFileSystem,
		private $options: IOptions,
		private $logcatHelper: Mobile.ILogcatHelper,
		private $androidProcessService: Mobile.IAndroidProcessService,
		private $httpClient: Server.IHttpClient,
		protected $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $errors: IErrors,
		$logger: ILogger,
		$hooksService: IHooksService,
	) {
		super($logger, $hooksService, $deviceLogProvider);
	}

	public async getInstalledApplications(): Promise<string[]> {
		const result =
			(await this.adb.executeShellCommand(["pm", "list", "packages"])) || "";
		const regex = /package:(.+)/;
		return result
			.split(EOL)
			.map((packageString: string) => {
				const match = packageString.match(regex);
				return match ? match[1] : null;
			})
			.filter((parsedPackage: string) => parsedPackage !== null);
	}

	@hook("install")
	public async installApplication(
		packageFilePath: string,
		appIdentifier?: string,
		buildData?: IAndroidBuildData,
	): Promise<void> {
		if (appIdentifier) {
			const deviceRootPath = `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${appIdentifier}`;
			await this.adb.executeShellCommand(["rm", "-rf", deviceRootPath]);
		}

		const { dir, name, ext } = parse(packageFilePath);
		if (ext === AAB_EXTENSION_NAME) {
			const apksOutputPath = join(dir, name) + APKS_EXTENSION_NAME;
			if (!this.hasValidApksFile(packageFilePath, apksOutputPath)) {
				await this.$androidBundleToolService.buildApks({
					aabFilePath: packageFilePath,
					apksOutputPath,
					signingData: <IAndroidSigningData>buildData,
				});
			}
			await this.$androidBundleToolService.installApks({
				apksFilePath: apksOutputPath,
				deviceId: this.identifier,
			});
		} else {
			return this.adb.executeCommand(["install", "-r", `${packageFilePath}`]);
		}
	}

	public uninstallApplication(appIdentifier: string): Promise<void> {
		// Need to set the treatErrorsAsWarnings to true because when using `ns run` command if the application is not installed on the device it will throw error
		return this.adb.executeShellCommand(
			["pm", "uninstall", `${appIdentifier}`],
			{ treatErrorsAsWarnings: true },
		);
	}

	public async startApplication(
		appData: Mobile.IStartApplicationData,
	): Promise<void> {
		if (appData.waitForDebugger) {
			await this.adb.executeShellCommand([
				`cat /dev/null > ${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${appData.appId}-debugbreak`,
			]);
		}

		// If the app is debuggable, the Runtime will update the file when its ready for debugging
		// and we will be able to take decisions and synchronize the debug experience based on the content
		await this.adb.executeShellCommand([
			`cat /dev/null > ${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${appData.appId}-debugger-started`,
		]);

		/*
		Example "pm dump <app_identifier> | grep -A 1 MAIN" output"
			android.intent.action.MAIN:
			3b2df03 org.nativescript.cliapp/com.tns.NativeScriptActivity filter 50dd82e
			Action: "android.intent.action.MAIN"
			Category: "android.intent.category.LAUNCHER"
			--
			intent={act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=org.nativescript.cliapp/com.tns.NativeScriptActivity}
			realActivity=org.nativescript.cliapp/com.tns.NativeScriptActivity
			--
			Intent { act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=org.nativescript.cliapp/com.tns.NativeScriptActivity }
			frontOfTask=true task=TaskRecord{fe592ac #449 A=org.nativescript.cliapp U=0 StackId=1 sz=1}
		*/
		const appIdentifier = appData.appId;
		const pmDumpOutput = await this.adb.executeShellCommand([
			"pm",
			"dump",
			appIdentifier,
			"|",
			"grep",
			"-A",
			"1",
			"MAIN",
		]);
		const activityMatch = this.getFullyQualifiedActivityRegex(appIdentifier);
		const match = activityMatch.exec(pmDumpOutput);
		const possibleIdentifier = match && match[0];

		if (possibleIdentifier) {
			await this.adb.executeShellCommand([
				"am",
				"start",
				"-n",
				possibleIdentifier,
			]);
		} else {
			this.$logger.trace(
				`Tried starting activity for: ${appIdentifier}, using activity manager but failed.`,
			);
			await this.adb.executeShellCommand([
				"monkey",
				"-p",
				appIdentifier,
				"-c",
				"android.intent.category.LAUNCHER",
				"1",
			]);
		}
		await this.onAppLaunch(appData);
	}

	private async onAppLaunch(appData: Mobile.IStartApplicationData) {
		const appIdentifier = appData.appId;

		if (!this.$options.justlaunch && !appData.justLaunch) {
			const deviceIdentifier = this.identifier;
			const processIdentifier = await this.getAppProcessId(
				deviceIdentifier,
				appIdentifier,
			);
			if (processIdentifier) {
				this.$deviceLogProvider.setApplicationPidForDevice(
					deviceIdentifier,
					processIdentifier,
				);

				this.$deviceLogProvider.setApplicationIdForDevice(
					deviceIdentifier,
					appIdentifier,
				);

				this.$deviceLogProvider.setProjectDirForDevice(
					deviceIdentifier,
					appData.projectDir,
				);

				await this.$logcatHelper.start({
					deviceIdentifier: this.identifier,
					pid: processIdentifier,
					appId: appIdentifier,
					onAppRestarted: () => {
						// If the app restarts, we update the PID and
						// restart log helper.
						this.onAppLaunch(appData);
					},
				});
			} else {
				await this.$logcatHelper.dump(this.identifier);
				this.$errors.fail(
					`Unable to find running "${appIdentifier}" application on device "${deviceIdentifier}".`,
				);
			}
		}
	}

	private async getAppProcessId(
		deviceIdentifier: string,
		appIdentifier: string,
	) {
		const appIdCheckStartTime = new Date().getTime();
		let processIdentifier = "";
		let hasTimedOut = false;

		while (!processIdentifier && !hasTimedOut) {
			processIdentifier = await this.$androidProcessService.getAppProcessId(
				deviceIdentifier,
				appIdentifier,
			);
			if (!processIdentifier) {
				this.$logger.trace(
					`Wasn't able to get pid of the app. Sleeping for "${this.PID_CHECK_INTERVAL}ms".`,
				);
				await sleep(this.PID_CHECK_INTERVAL);
				hasTimedOut =
					new Date().getTime() - appIdCheckStartTime > this.PID_CHECK_TIMEOUT;
			}
		}

		return processIdentifier;
	}

	public stopApplication(appData: Mobile.IApplicationData): Promise<void> {
		this.$logcatHelper.stop(this.identifier);
		this.$deviceLogProvider.setApplicationPidForDevice(this.identifier, null);
		this.$deviceLogProvider.setProjectDirForDevice(this.identifier, null);
		return this.adb.executeShellCommand([
			"am",
			"force-stop",
			`${appData.appId}`,
		]);
	}

	public getDebuggableApps(): Promise<Mobile.IDeviceApplicationInformation[]> {
		return this.$androidProcessService.getDebuggableApps(this.identifier);
	}

	public async getDebuggableAppViews(
		appIdentifiers: string[],
	): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> {
		const mappedAppIdentifierPorts =
				await this.$androidProcessService.getMappedAbstractToTcpPorts(
					this.identifier,
					appIdentifiers,
					TARGET_FRAMEWORK_IDENTIFIERS.Cordova,
				),
			applicationViews: IDictionary<Mobile.IDebugWebViewInfo[]> = {};

		await Promise.all(
			_.map(
				mappedAppIdentifierPorts,
				async (port: number, appIdentifier: string) => {
					applicationViews[appIdentifier] = [];
					const localAddress = `http://127.0.0.1:${port}/json`;

					try {
						if (port) {
							const apps = (await this.$httpClient.httpRequest(localAddress))
								.body;
							applicationViews[appIdentifier] = JSON.parse(apps);
						}
					} catch (err) {
						this.$logger.trace(
							`Error while checking ${localAddress}. Error is: ${err.message}`,
						);
					}
				},
			),
		);

		return applicationViews;
	}

	@cache()
	private getFullyQualifiedActivityRegex(appIdentifier: string): RegExp {
		const packageActivitySeparator = "\\/";
		const fullJavaClassName = "([a-zA-Z_0-9]*\\.)*[A-Z_$]($[A-Z_$]|[$_\\w_])*";

		return new RegExp(
			`${regExpEscape(
				appIdentifier,
			)}${packageActivitySeparator}${fullJavaClassName}`,
			`m`,
		);
	}

	private hasValidApksFile(aabFilaPath: string, apksFilePath: string): boolean {
		let isValid = false;
		if (this.$fs.exists(apksFilePath)) {
			const lastUpdatedApks = this.$fs.getFsStats(apksFilePath).ctime.getTime();
			const lastUpdatedAab = this.$fs.getFsStats(aabFilaPath).ctime.getTime();
			isValid = lastUpdatedApks >= lastUpdatedAab;
		}

		return isValid;
	}
}
