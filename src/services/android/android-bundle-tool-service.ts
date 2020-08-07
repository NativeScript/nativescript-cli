import { resolve, join } from "path";
import { hasValidAndroidSigning } from "../../common/helpers";
import { IChildProcess, IErrors, ISysInfo } from "../../common/declarations";

import {
	IAndroidBundleToolService,
	IBuildApksOptions,
	IInstallApksOptions
} from "../../definitions/android-bundle-tool-service";
import * as _ from "lodash";

export class AndroidBundleToolService implements IAndroidBundleToolService {
	private javaPath: string;
	private aabToolPath: string;
	constructor(
		private $childProcess: IChildProcess,
		private $sysInfo: ISysInfo,
		private $errors: IErrors
	) {
		this.aabToolPath = resolve(join(__dirname, "../../../vendor/aab-tool/bundletool.jar"));
	}

	public async buildApks(options: IBuildApksOptions): Promise<void> {
		if (!hasValidAndroidSigning(options.signingData)) {
			this.$errors.fail(`Unable to build "apks" without a full signing information.`);
		}

		const aabToolResult = await this.execBundleTool([
			"build-apks",
			"--bundle",
			options.aabFilePath,
			"--output", options.apksOutputPath,
			"--ks", options.signingData.keyStorePath,
			"--ks-pass", `pass:${options.signingData.keyStorePassword}`,
			"--ks-key-alias", options.signingData.keyStoreAlias,
			"--key-pass", `pass:${options.signingData.keyStoreAliasPassword}`
		]);
		if (aabToolResult.exitCode !== 0 && aabToolResult.stderr) {
			this.$errors.fail(`Unable to build "apks" from the provided "aab". Error: ${aabToolResult.stderr}`);
		}
	}

	public async installApks(options: IInstallApksOptions): Promise<void> {
		const aabToolResult = await this.execBundleTool(["install-apks", "--apks", options.apksFilePath, "--device-id", options.deviceId]);
		if (aabToolResult.exitCode !== 0 && aabToolResult.stderr) {
			this.$errors.fail(`Unable to install "apks" on device "${options.deviceId}". Error: ${aabToolResult.stderr}`);
		}
	}

	private async execBundleTool(args: string[]) {
		const javaPath = await this.getJavaPath();
		const defaultArgs = [
			"-jar",
			this.aabToolPath
		];

		const result = await this.$childProcess.trySpawnFromCloseEvent(javaPath, _.concat(defaultArgs, args));

		return result;
	}

	private async getJavaPath(): Promise<string> {
		if (!this.javaPath) {
			this.javaPath = await this.$sysInfo.getJavaPath();
		}

		return this.javaPath;
	}
}

$injector.register("androidBundleToolService", AndroidBundleToolService);
