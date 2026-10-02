import * as path from "path";
import { Configurations } from "../../common/constants";
import { IGradleBuildArgsService } from "../../definitions/gradle";
import { IAndroidToolsInfo } from "../../declarations";
import { IAndroidBuildData } from "../../definitions/build";
import { IHooksService, IAnalyticsService } from "../../common/declarations";
import { injector } from "../../common/yok";
import { IProjectData } from "../../definitions/project";
import { LoggerLevel } from "../../constants";

export class GradleBuildArgsService implements IGradleBuildArgsService {
	constructor(
		private $androidToolsInfo: IAndroidToolsInfo,
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

		const toolsInfo = this.$androidToolsInfo.getToolsInfo({
			projectDir: buildData.projectDir,
		});

		args.push(
			`-PcompileSdk=${toolsInfo.compileSdkVersion}`,
			`-PtargetSdk=${toolsInfo.targetSdkVersion}`,
			`-PbuildToolsVersion=${toolsInfo.buildToolsVersion}`,
			`-PgenerateTypings=${toolsInfo.generateTypings}`,
			`-PprojectRoot=${this.$projectData.projectDir}`,
			// settings.gradle runs before the project properties are available,
			// so the same values have to be passed as system properties too
			`-DprojectRoot=${this.$projectData.projectDir}`,
			`-PappBuildPath=${this.$projectData.getBuildRelativeDirectoryPath()}`,
			`-DappBuildPath=${this.$projectData.getBuildRelativeDirectoryPath()}`,
			`-PappPath=${this.$projectData.getAppDirectoryPath()}`,
			`-PappResourcesPath=${this.$projectData.getAppResourcesDirectoryPath()}`
		);

		args.push(...this.getUserDefinedGradleArgs(buildData.gradleArgs));

		if (buildData.release) {
			args.push("-Prelease");
		}

		// a debug build can be signed too - for example when building a system app
		if (buildData.keyStorePath) {
			args.push(
				`-PksPath=${path.resolve(buildData.keyStorePath)}`,
				`-Palias=${buildData.keyStoreAlias}`,
				`-Ppassword=${buildData.keyStoreAliasPassword}`,
				`-PksPassword=${buildData.keyStorePassword}`
			);
		}

		return args;
	}

	/**
	 * Gradle args coming from `android.gradleArgs` in the project config, followed
	 * by the ones passed on the command line through `--gradleArgs`. A single
	 * value may hold several space separated args.
	 */
	private getUserDefinedGradleArgs(commandLineArgs: string[]): string[] {
		const gradleArgs = (
			this.$projectData.nsConfig?.android?.gradleArgs ?? []
		).concat(commandLineArgs ?? []);

		return gradleArgs.reduce<string[]>(
			(args, arg) =>
				args.concat(
					arg
						.split(" ")
						.map((a) => a.trim())
						.filter((a) => !!a)
				),
			[],
		);
	}

	public getBuildLoggingArgs(): string[] {
		const args = [];

		const logLevel = this.$logger.getLevel();
		if (logLevel === LoggerLevel.TRACE) {
			args.push("--stacktrace", "--debug");
		} else if (logLevel === LoggerLevel.DEBUG) {
			args.push("--stacktrace", "--info");
		} else if (logLevel === LoggerLevel.INFO) {
			args.push("--quiet");
		}

		return args;
	}

	private getBuildTaskName(buildData: IAndroidBuildData): string {
		let baseTaskName = buildData.androidBundle ? "bundle" : "assemble";

		// a product flavor sits between the task and the build type -
		// `assembleFooRelease`, `bundleFooDebug`
		const flavor = buildData.gradleFlavor;
		if (flavor) {
			baseTaskName += flavor[0].toUpperCase() + flavor.slice(1);
		}

		const buildTaskName = buildData.release
			? `${baseTaskName}${Configurations.Release}`
			: `${baseTaskName}${Configurations.Debug}`;

		return buildTaskName;
	}
}
injector.register("gradleBuildArgsService", GradleBuildArgsService);
