import * as path from "path";
import { Configurations } from "../../common/constants";

export class GradleBuildArgsService implements IGradleBuildArgsService {
	constructor(private $androidToolsInfo: IAndroidToolsInfo,
		private $logger: ILogger) { }

	public getBuildTaskArgs(buildData: IAndroidBuildData): string[] {
		const args = this.getBaseTaskArgs(buildData);
		args.unshift(this.getBuildTaskName(buildData));

		return args;
	}

	public getCleanTaskArgs(buildData: IAndroidBuildData): string[] {
		const args = this.getBaseTaskArgs(buildData);
		args.unshift("clean");

		return args;
	}

	private getBaseTaskArgs(buildData: IAndroidBuildData): string[] {
		const args = this.getBuildLoggingArgs();

		const toolsInfo = this.$androidToolsInfo.getToolsInfo();
		args.push(
			`-PcompileSdk=android-${toolsInfo.compileSdkVersion}`,
			`-PtargetSdk=${toolsInfo.targetSdkVersion}`,
			`-PbuildToolsVersion=${toolsInfo.buildToolsVersion}`,
			`-PgenerateTypings=${toolsInfo.generateTypings}`
		);

		if (buildData.release) {
			args.push(
				"-Prelease",
				`-PksPath=${path.resolve(buildData.keyStorePath)}`,
				`-Palias=${buildData.keyStoreAlias}`,
				`-Ppassword=${buildData.keyStoreAliasPassword}`,
				`-PksPassword=${buildData.keyStorePassword}`
			);
		}

		return args;
	}

	private getBuildLoggingArgs(): string[] {
		const args = [];

		const logLevel = this.$logger.getLevel();
		if (logLevel === "TRACE") {
			args.push("--stacktrace", "--debug");
		} else if (logLevel === "INFO") {
			args.push("--quiet");
		}

		return args;
	}

	private getBuildTaskName(buildData: IAndroidBuildData): string {
		const baseTaskName = buildData.androidBundle ? "bundle" : "assemble";
		const buildTaskName = buildData.release ? `${baseTaskName}${Configurations.Release}` : `${baseTaskName}${Configurations.Debug}`;

		return buildTaskName;
	}
}
$injector.register("gradleBuildArgsService", GradleBuildArgsService);
