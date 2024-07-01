import * as path from "path";
import { Configurations } from "../../common/constants";
import { IGradleBuildArgsService } from "../../definitions/gradle";
import { IAndroidBuildData } from "../../definitions/build";
import { IHooksService, IAnalyticsService } from "../../common/declarations";
import { injector } from "../../common/yok";
import { IProjectData } from "../../definitions/project";

export class GradleBuildArgsService implements IGradleBuildArgsService {
	constructor(
		private $hooksService: IHooksService,
		private $analyticsService: IAnalyticsService,
		private $staticConfig: Config.IStaticConfig,
		private $projectData: IProjectData,
		private $logger: ILogger
	) {}

	public async getBuildTaskArgs(
		buildData: IAndroidBuildData
	): Promise<string[]> {
		const args = this.getBaseTaskArgs(buildData);
		args.unshift(this.getBuildTaskName(buildData));

		if (
			await this.$analyticsService.isEnabled(
				this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME
			)
		) {
			args.push("-PgatherAnalyticsData=true");
		}

		// allow modifying gradle args from a `before-build-task-args` hook
		await this.$hooksService.executeBeforeHooks("build-task-args", {
			hookArgs: { args },
		});

		return args;
	}

	public getCleanTaskArgs(buildData: IAndroidBuildData): string[] {
		const args = this.getBaseTaskArgs(buildData);
		args.unshift("clean");

		return args;
	}

	private getBaseTaskArgs(buildData: IAndroidBuildData): string[] {
		const args = this.getBuildLoggingArgs();

		// ensure we initialize project data
		this.$projectData.initializeProjectData(buildData.projectDir);

		args.push(
			`-PappPath=${this.$projectData.getAppDirectoryPath()}`,
			`-PappResourcesPath=${this.$projectData.getAppResourcesDirectoryPath()}`
		);
		if (buildData.gradleArgs) {
			args.push(buildData.gradleArgs);
		}

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
		const buildTaskName = buildData.release
			? `${baseTaskName}${Configurations.Release}`
			: `${baseTaskName}${Configurations.Debug}`;

		return buildTaskName;
	}
}
injector.register("gradleBuildArgsService", GradleBuildArgsService);
