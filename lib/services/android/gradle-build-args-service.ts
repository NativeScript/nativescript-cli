import * as path from "path";
import { Configurations } from "../../common/constants";
import { IGradleBuildArgsService } from "../../definitions/gradle";
import { IAndroidBuildData } from "../../definitions/build";
import {
	IHooksService,
	IAnalyticsService,
	IFileSystem,
} from "../../common/declarations";
import { injector } from "../../common/yok";
import { IProjectData, IProjectDataService } from "../../definitions/project";
import { IOptions } from "../../declarations";
import { PlatformTypes } from "../../constants";
import { getGradleFactsFilePath } from "./gradle-facts";

export class GradleBuildArgsService implements IGradleBuildArgsService {
	constructor(
		private $hooksService: IHooksService,
		private $analyticsService: IAnalyticsService,
		private $staticConfig: Config.IStaticConfig,
		private $projectDataService: IProjectDataService,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $options: IOptions,
	) {}

	public async getBuildTaskArgs(
		buildData: IAndroidBuildData,
	): Promise<string[]> {
		const args = this.getBaseTaskArgs(buildData);
		args.unshift(this.getBuildTaskName(buildData));

		if (
			await this.$analyticsService.isEnabled(
				this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME,
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

		const projectData = this.$projectDataService.getProjectData(
			buildData.projectDir,
		);

		args.push(
			`-PappPath=${projectData.getAppDirectoryPath()}`,
			`-PappResourcesPath=${projectData.getAppResourcesDirectoryPath()}`,
		);

		const factsFile = this.getGradleFactsFile(projectData);
		if (factsFile) {
			args.push(`-Pnativescript.factsFile=${factsFile}`);
		}

		if (buildData.gradleArgs) {
			args.push(buildData.gradleArgs);
		}

		if (buildData.release) {
			args.push(
				"-Prelease",
				`-PksPath=${path.resolve(buildData.keyStorePath)}`,
				`-Palias=${buildData.keyStoreAlias}`,
				`-Ppassword=${buildData.keyStoreAliasPassword}`,
				`-PksPassword=${buildData.keyStorePassword}`,
			);
		}

		return args;
	}

	private getGradleFactsFile(projectData: IProjectData): string | null {
		const platformDir =
			this.$options.hostProjectPath ||
			(projectData.platformsDir &&
				path.join(projectData.platformsDir, PlatformTypes.android));
		if (!platformDir) {
			return null;
		}

		const factsFile = getGradleFactsFilePath(platformDir);
		return this.$fs.exists(factsFile) ? factsFile : null;
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
