import { join } from "path";
import * as _ from "lodash";
import { hasValidAndroidSigning } from "../../common/helpers";
import {
	IChildProcess,
	IErrors,
	IFileSystem,
	ISettingsService,
	ISysInfo,
	Server,
} from "../../common/declarations";
import {
	IAndroidBundleToolService,
	IBuildApksOptions,
	IInstallApksOptions,
} from "../../definitions/android-bundle-tool-service";
import { ITerminalSpinnerService } from "../../definitions/terminal-spinner-service";
import {
	BUNDLETOOL_CACHE_DIRNAME,
	BUNDLETOOL_PATH_ENV_VAR,
	BUNDLETOOL_RELEASES_URL,
	BUNDLETOOL_SHA256,
	BUNDLETOOL_VERSION,
} from "../../constants";
import { injector } from "../../common/yok";

export class AndroidBundleToolService implements IAndroidBundleToolService {
	// a cold download of ~32MB can outlast the default 10s lock, and a second
	// process has to keep waiting rather than pull the same jar again
	private static LOCK_OPTIONS: ILockOptions = {
		stale: 5 * 60 * 1000,
		retriesObj: {
			retries: 300,
			minTimeout: 200,
			maxTimeout: 2000,
			factor: 1.5,
		},
	};

	private javaPath: string;
	private bundleToolPathPromise: Promise<string>;

	constructor(
		private $childProcess: IChildProcess,
		private $sysInfo: ISysInfo,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $lockService: ILockService,
		private $logger: ILogger,
		private $settingsService: ISettingsService,
		private $terminalSpinnerService: ITerminalSpinnerService,
	) {}

	public async buildApks(options: IBuildApksOptions): Promise<void> {
		if (!hasValidAndroidSigning(options.signingData)) {
			this.$errors.fail(
				`Unable to build "apks" without a full signing information.`,
			);
		}

		const aabToolResult = await this.execBundleTool([
			"build-apks",
			"--bundle",
			options.aabFilePath,
			"--output",
			options.apksOutputPath,
			"--ks",
			options.signingData.keyStorePath,
			"--ks-pass",
			`pass:${options.signingData.keyStorePassword}`,
			"--ks-key-alias",
			options.signingData.keyStoreAlias,
			"--key-pass",
			`pass:${options.signingData.keyStoreAliasPassword}`,
		]);
		if (aabToolResult.exitCode !== 0 && aabToolResult.stderr) {
			this.$errors.fail(
				`Unable to build "apks" from the provided "aab". Error: ${aabToolResult.stderr}`,
			);
		}
	}

	public async installApks(options: IInstallApksOptions): Promise<void> {
		const aabToolResult = await this.execBundleTool([
			"install-apks",
			"--apks",
			options.apksFilePath,
			"--device-id",
			options.deviceId,
		]);
		if (aabToolResult.exitCode !== 0 && aabToolResult.stderr) {
			this.$errors.fail(
				`Unable to install "apks" on device "${options.deviceId}". Error: ${aabToolResult.stderr}`,
			);
		}
	}

	private async execBundleTool(args: string[]) {
		const javaPath = await this.getJavaPath();
		const defaultArgs = ["-jar", await this.getBundleToolPath()];

		const result = await this.$childProcess.trySpawnFromCloseEvent(
			javaPath,
			_.concat(defaultArgs, args),
		);

		return result;
	}

	private async getJavaPath(): Promise<string> {
		if (!this.javaPath) {
			this.javaPath = await this.$sysInfo.getJavaPath();
		}

		return this.javaPath;
	}

	private getBundleToolPath(): Promise<string> {
		this.bundleToolPathPromise =
			this.bundleToolPathPromise || this.resolveBundleToolPath();

		return this.bundleToolPathPromise;
	}

	private async resolveBundleToolPath(): Promise<string> {
		const customPath = process.env[BUNDLETOOL_PATH_ENV_VAR];
		if (customPath) {
			if (!this.$fs.exists(customPath)) {
				this.$errors.fail(
					`${BUNDLETOOL_PATH_ENV_VAR} is set to "${customPath}", but no file exists there.`,
				);
			}

			this.$logger.trace(
				`Using bundletool from ${BUNDLETOOL_PATH_ENV_VAR}: ${customPath}`,
			);
			return customPath;
		}

		const cacheDir = join(
			this.$settingsService.getProfileDir(),
			BUNDLETOOL_CACHE_DIRNAME,
		);
		const jarPath = join(cacheDir, `bundletool-all-${BUNDLETOOL_VERSION}.jar`);
		this.$fs.ensureDirectoryExists(cacheDir);

		if (await this.isExpectedJar(jarPath)) {
			return jarPath;
		}

		return this.$lockService.executeActionWithLock(
			async () => {
				// whoever held the lock before us may have just downloaded it
				if (await this.isExpectedJar(jarPath)) {
					return jarPath;
				}

				await this.downloadBundleTool(jarPath);
				return jarPath;
			},
			join(cacheDir, `bundletool-${BUNDLETOOL_VERSION}.lock`),
			AndroidBundleToolService.LOCK_OPTIONS,
		);
	}

	private async isExpectedJar(jarPath: string): Promise<boolean> {
		if (!this.$fs.exists(jarPath)) {
			return false;
		}

		const shasum = await this.$fs.getFileShasum(jarPath, {
			algorithm: "sha256",
		});
		if (shasum === BUNDLETOOL_SHA256) {
			return true;
		}

		this.$logger.warn(
			`Cached bundletool at "${jarPath}" does not match the expected checksum and will be downloaded again.`,
		);
		this.$fs.deleteFile(jarPath);
		return false;
	}

	private async downloadBundleTool(jarPath: string): Promise<void> {
		const jarName = `bundletool-all-${BUNDLETOOL_VERSION}.jar`;
		const url = `${BUNDLETOOL_RELEASES_URL}/${BUNDLETOOL_VERSION}/${jarName}`;
		const tempPath = `${jarPath}.download`;
		const spinner = this.$terminalSpinnerService.createSpinner();

		spinner.start(`Downloading bundletool ${BUNDLETOOL_VERSION}`);

		try {
			await this.$httpClient.httpRequest({
				url,
				method: "GET",
				// identity keeps Content-Length equal to the real jar size, so the
				// progress readout is not skewed by a re-compressed response
				headers: { "Accept-Encoding": "identity" },
				pipeTo: this.$fs.createWriteStream(tempPath),
				onDownloadProgress: (progress: { loaded: number; total?: number }) => {
					spinner.text = `Downloading bundletool ${BUNDLETOOL_VERSION} ${this.formatProgress(
						progress,
					)}`;
				},
			});
		} catch (err) {
			spinner.fail(`Failed to download bundletool ${BUNDLETOOL_VERSION}`);
			this.$fs.deleteFile(tempPath);
			this.$errors.fail(
				`Unable to download bundletool from "${url}". ` +
					`Set ${BUNDLETOOL_PATH_ENV_VAR} to the path of a local bundletool jar to skip the download. ` +
					`Error: ${err.message}`,
			);
		}

		const shasum = await this.$fs.getFileShasum(tempPath, {
			algorithm: "sha256",
		});
		if (shasum !== BUNDLETOOL_SHA256) {
			spinner.fail(`Failed to download bundletool ${BUNDLETOOL_VERSION}`);
			this.$fs.deleteFile(tempPath);
			this.$errors.fail(
				`Checksum mismatch for bundletool downloaded from "${url}". ` +
					`Expected ${BUNDLETOOL_SHA256}, got ${shasum}.`,
			);
		}

		// rename is atomic, so a concurrent reader never sees a partial jar
		this.$fs.rename(tempPath, jarPath);
		spinner.succeed(`Downloaded bundletool ${BUNDLETOOL_VERSION}`);
	}

	private formatProgress(progress: { loaded: number; total?: number }): string {
		const toMb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

		return progress.total
			? `${toMb(progress.loaded)}/${toMb(progress.total)} MB`
			: `${toMb(progress.loaded)} MB`;
	}
}

injector.register("androidBundleToolService", AndroidBundleToolService);
