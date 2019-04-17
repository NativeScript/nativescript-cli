import { attachAwaitDetach } from "../../common/helpers";
import * as constants from "../../constants";
import { EventEmitter } from "events";

export class GradleBuildService extends EventEmitter implements IGradleBuildService {
	constructor(
		private $childProcess: IChildProcess,
		private $gradleBuildArgsService: IGradleBuildArgsService,
		private $gradleCommandService: IGradleCommandService,
	) { super(); }

	public async buildProject(projectRoot: string, buildConfig: IAndroidBuildConfig): Promise<void> {
		const buildTaskArgs = this.$gradleBuildArgsService.getBuildTaskArgs(buildConfig);
		const spawnOptions = { emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME }, throwError: true };
		const gradleCommandOptions = { cwd: projectRoot, message: "Gradle build...", stdio: buildConfig.buildOutputStdio, spawnOptions };

		await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME,
			this.$childProcess,
			(data: any) => this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data),
			this.$gradleCommandService.executeCommand(buildTaskArgs, gradleCommandOptions)
		);
	}

	public async cleanProject(projectRoot: string, buildConfig: IAndroidBuildConfig): Promise<void> {
		const cleanTaskArgs = this.$gradleBuildArgsService.getCleanTaskArgs(buildConfig);
		const gradleCommandOptions = { cwd: projectRoot, message: "Gradle clean..." };
		await this.$gradleCommandService.executeCommand(cleanTaskArgs, gradleCommandOptions);
	}
}
$injector.register("gradleBuildService", GradleBuildService);
