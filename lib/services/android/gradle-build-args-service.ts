import * as path from "path";
import { Configurations } from "../../common/constants";

export class GradleBuildArgsService implements IGradleBuildArgsService {
	constructor(private $androidToolsInfo: IAndroidToolsInfo,
		private $logger: ILogger) { }

	public getBuildTaskArgs(buildConfig: IAndroidBuildConfig): string[] {
		const args = this.getBaseTaskArgs(buildConfig);
		args.unshift(this.getBuildTaskName(buildConfig));

		return args;
	}

	public getCleanTaskArgs(buildConfig: IAndroidBuildConfig): string[] {
		const args = this.getBaseTaskArgs(buildConfig);
		args.unshift("clean");

		return args;
	}

	private getBaseTaskArgs(buildConfig: IAndroidBuildConfig): string[] {
		const args = this.getBuildLoggingArgs();

		const toolsInfo = this.$androidToolsInfo.getToolsInfo();
		args.push(
			`-PcompileSdk=android-${toolsInfo.compileSdkVersion}`,
			`-PbuildToolsVersion=${toolsInfo.buildToolsVersion}`,
			`-PgenerateTypings=${toolsInfo.generateTypings}`
		);

		if (buildConfig.release) {
			args.push(
				"-Prelease",
				`-PksPath=${path.resolve(buildConfig.keyStorePath)}`,
				`-Palias=${buildConfig.keyStoreAlias}`,
				`-Ppassword=${buildConfig.keyStoreAliasPassword}`,
				`-PksPassword=${buildConfig.keyStorePassword}`
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

	private getBuildTaskName(buildConfig: IAndroidBuildConfig): string {
		const baseTaskName = buildConfig.androidBundle ? "bundle" : "assemble";
		const buildTaskName = buildConfig.release ? `${baseTaskName}${Configurations.Release}` : `${baseTaskName}${Configurations.Debug}`;

		return buildTaskName;
	}
}
$injector.register("gradleBuildArgsService", GradleBuildArgsService);
