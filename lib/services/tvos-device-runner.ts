import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
import * as chokidar from "chokidar";
import { IChildProcess } from "../common/declarations";
import { IOptions } from "../declarations";
import { IBuildController, IBuildDataService } from "../definitions/build";
import { IProjectDataService } from "../definitions/project";

interface CoreDevice {
	identifier: string;
	hardwareProperties?: { deviceType?: string; udid?: string };
	deviceProperties?: { name?: string };
	connectionProperties?: { pairingState?: string };
}

export function selectAppleTV(
	devices: CoreDevice[],
	selector: string,
): CoreDevice | undefined {
	const matches = devices.filter(
		(device) =>
			device.hardwareProperties?.deviceType === "appleTV" &&
			device.connectionProperties?.pairingState === "paired" &&
			[
				device.identifier,
				device.hardwareProperties?.udid,
				device.deviceProperties?.name,
			].some((value) => value?.toLowerCase() === selector.toLowerCase()),
	);
	if (matches.length > 1)
		throw new Error(
			"Multiple paired Apple TVs match. Use the CoreDevice identifier from xcrun devicectl list devices.",
		);
	return matches[0];
}

/** CoreDevice deployment for network-paired TVs missing from ios-device-lib. */
export class TvOSDeviceRunner {
	constructor(
		private $childProcess: IChildProcess,
		private $options: IOptions,
		private $buildController: IBuildController,
		private $buildDataService: IBuildDataService,
		private $projectDataService: IProjectDataService,
		private $logger: ILogger,
	) {}

	public async tryRun(): Promise<boolean> {
		if (this.$options.emulator || !this.$options.device) return false;
		const temporary = await fs.mkdtemp(
			path.join(os.tmpdir(), "ns-tvos-device-"),
		);
		let selected: CoreDevice;
		try {
			const report = path.join(temporary, "devices.json");
			try {
				await this.$childProcess.execFile("xcrun", [
					"devicectl",
					"list",
					"devices",
					"--json-output",
					report,
				]);
			} catch (error) {
				this.$logger.trace(
					"CoreDevice discovery unavailable; using existing device discovery",
					error,
				);
				return false;
			}
			selected = selectAppleTV(
				JSON.parse(await fs.readFile(report, "utf8")).result?.devices || [],
				this.$options.device,
			);
		} finally {
			await fs.rm(temporary, { recursive: true, force: true });
		}
		if (!selected) return false; // Simulator IDs continue through the existing path.
		const project = this.$projectDataService.getProjectData();
		this.$logger.info(
			`Using CoreDevice for Apple TV ${selected.deviceProperties?.name || selected.identifier}.`,
		);
		const deploy = async () => {
			const build = this.$buildDataService.getBuildData(
				project.projectDir,
				"tvos",
				{
					...this.$options.argv,
					device: undefined,
					emulator: false,
					forDevice: true,
					buildForDevice: true,
					watch: false,
					hmr: false,
				},
			);
			const archive = await this.$buildController.prepareAndBuild(build);
			const extracted = await fs.mkdtemp(
				path.join(os.tmpdir(), "ns-tvos-install-"),
			);
			try {
				await this.$childProcess.execFile("/usr/bin/unzip", [
					"-q",
					archive,
					"-d",
					extracted,
				]);
				const payload = path.join(extracted, "Payload");
				const applications = (await fs.readdir(payload)).filter((name) =>
					name.endsWith(".app"),
				);
				if (applications.length !== 1)
					throw new Error("Expected one application in the built tvOS IPA.");
				await this.$childProcess.execFile("xcrun", [
					"devicectl",
					"device",
					"install",
					"app",
					"--device",
					selected.identifier,
					path.join(payload, applications[0]),
				]);
				const appId =
					project.projectIdentifiers.tvos || project.projectIdentifiers.ios;
				await this.$childProcess.execFile("xcrun", [
					"devicectl",
					"device",
					"process",
					"launch",
					"--device",
					selected.identifier,
					"--terminate-existing",
					appId,
				]);
				this.$logger.info(
					`Successfully run application ${appId} on Apple TV ${selected.identifier}.`,
				);
			} finally {
				await fs.rm(extracted, { recursive: true, force: true });
			}
		};
		await deploy();
		if (this.$options.watch !== false) {
			this.$logger.info(
				"Watching for changes. CoreDevice uses full rebuild/install; HMR and debugger attachment are not available on this transport.",
			);
			const watcher = chokidar.watch(
				[
					project.appDirectoryPath,
					project.appResourcesDirectoryPath,
					path.join(project.projectDir, "nativescript.config.*"),
					path.join(project.projectDir, "webpack.config.*"),
				],
				{ ignoreInitial: true },
			);
			let pending = false;
			let running = false;
			let timer: NodeJS.Timeout;
			const drain = async () => {
				if (running) return;
				running = true;
				while (pending) {
					pending = false;
					try {
						await deploy();
					} catch (error) {
						this.$logger.error(String(error));
					}
				}
				running = false;
			};
			watcher.on("all", () => {
				pending = true;
				clearTimeout(timer);
				timer = setTimeout(() => void drain(), 300);
			});
			watcher.on("error", (error) => this.$logger.error(String(error)));
		}
		return true;
	}
}
