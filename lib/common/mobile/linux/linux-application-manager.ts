import * as fs from "fs";
import * as path from "path";
import { ChildProcess, spawn } from "child_process";
import { ApplicationManagerBase } from "../application-manager-base";
import { IHooksService, IDictionary } from "../../declarations";
import { IBuildData } from "../../../definitions/build";

/** Port of the runtime's DevTools inspector for `ns debug linux`. */
export const LINUX_INSPECTOR_PORT = 9229;

/**
 * Runs the built app (the runtime executable next to `app/`) as a child process.
 * Logs come from its stdout/stderr; SIGUSR1 makes the runtime call `global.__onLiveSync()`.
 */
export class LinuxApplicationManager extends ApplicationManagerBase {
	private _executables: IDictionary<string> = {};
	private _process: ChildProcess | null = null;

	constructor(
		$logger: ILogger,
		$hooksService: IHooksService,
		$deviceLogProvider: Mobile.IDeviceLogProvider,
		private deviceIdentifier: string,
	) {
		super($logger, $hooksService, $deviceLogProvider);
		process.once("exit", () => this.kill());
	}

	public get inspectorPort(): number {
		return (
			parseInt(process.env.NS_LINUX_INSPECTOR_PORT, 10) || LINUX_INSPECTOR_PORT
		);
	}

	public async getInstalledApplications(): Promise<string[]> {
		return Object.keys(this._executables);
	}

	public async isApplicationInstalled(appIdentifier: string): Promise<boolean> {
		return !!this.executableFor({
			appId: appIdentifier,
			projectName: undefined,
		});
	}

	/** `packageFilePath` is the executable in the build output. */
	public async installApplication(
		packageFilePath: string,
		appIdentifier?: string,
		_buildData?: IBuildData,
	): Promise<void> {
		fs.chmodSync(packageFilePath, 0o755);
		this._executables[path.basename(packageFilePath)] = packageFilePath;
		if (appIdentifier) {
			this._executables[appIdentifier] = packageFilePath;
		}
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> {
		delete this._executables[appIdentifier];
	}

	public async startApplication(
		appData: Mobile.IStartApplicationData,
	): Promise<void> {
		const executable = this.executableFor(appData);
		if (!executable) {
			throw new Error(
				`${appData.projectName || appData.appId} is not built for Linux. Run \`ns build linux\` first.`,
			);
		}
		this.kill();

		const args: string[] = [];
		if (appData.waitForDebugger) {
			args.push(`--inspect-brk=${this.inspectorPort}`);
		} else if (appData.debugMode) {
			args.push(`--inspect=${this.inspectorPort}`);
		}
		const child = spawn(executable, args, {
			cwd: path.dirname(executable),
			stdio: ["ignore", "pipe", "pipe"],
		});
		this._process = child;
		this.$logger.trace(
			`[Linux] started ${executable} ${args.join(" ")} (pid ${child.pid})`,
		);

		const forward = (stream: NodeJS.ReadableStream) => {
			let pending = "";
			stream.setEncoding("utf8");
			stream.on("data", (chunk: string) => {
				pending += chunk;
				const lines = pending.split("\n");
				pending = lines.pop();
				for (const line of lines) {
					this.$deviceLogProvider.logData(line, "Linux", this.deviceIdentifier);
				}
			});
			stream.on("end", () => {
				if (pending) {
					this.$deviceLogProvider.logData(
						pending,
						"Linux",
						this.deviceIdentifier,
					);
				}
			});
		};
		forward(child.stdout);
		forward(child.stderr);
		child.once("exit", (code, signal) => {
			if (this._process === child) {
				this._process = null;
			}
			this.$logger.trace(`[Linux] app exited (code ${code}, signal ${signal})`);
		});
	}

	public async stopApplication(
		_appData: Mobile.IApplicationData,
	): Promise<void> {
		const child = this._process;
		if (!child) {
			return;
		}
		const exited = new Promise<void>((resolve) =>
			child.once("exit", () => resolve()),
		);
		this.kill();
		await Promise.race([
			exited,
			new Promise((resolve) => setTimeout(resolve, 3000)),
		]);
	}

	public async restartApplication(
		appData: Mobile.IStartApplicationData,
	): Promise<void> {
		await this.stopApplication(appData);
		await this.startApplication(appData);
	}

	public isRunning(): boolean {
		return !!this._process && this._process.exitCode === null;
	}

	/** Asks the running app to apply synced changes (webpack HMR). */
	public signalLiveSync(): boolean {
		if (!this.isRunning()) {
			return false;
		}
		return this._process.kill("SIGUSR1");
	}

	public async getDebuggableApps(): Promise<
		Mobile.IDeviceApplicationInformation[]
	> {
		return [];
	}

	public async getDebuggableAppViews(
		_appIdentifiers: string[],
	): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> {
		return {};
	}

	private executableFor(
		appData: Pick<Mobile.IApplicationData, "appId" | "projectName">,
	): string | null {
		const executable =
			(appData.appId && this._executables[appData.appId]) ||
			(appData.projectName && this._executables[appData.projectName]);
		return executable && fs.existsSync(executable) ? executable : null;
	}

	private kill(): void {
		if (this.isRunning()) {
			this._process.kill("SIGTERM");
		}
	}
}
