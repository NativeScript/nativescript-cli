import { attachAwaitDetach } from "../../common/helpers";
import * as constants from "../../constants";
import { EventEmitter } from "events";
import {
	IGradleBuildService,
	IGradleBuildArgsService,
	IGradleCommandService,
} from "../../definitions/gradle";
import { IAndroidBuildData } from "../../definitions/build";
import { IChildProcess } from "../../common/declarations";
import { injector } from "../../common/yok";

export class GradleBuildService
	extends EventEmitter
	implements IGradleBuildService {
	constructor(
		private $childProcess: IChildProcess,
		private $gradleBuildArgsService: IGradleBuildArgsService,
		private $gradleCommandService: IGradleCommandService,
		private $devicesService: Mobile.IDevicesService
	) {
		super();
	}

	public async buildProject(
		projectRoot: string,
		buildData: IAndroidBuildData
	): Promise<void> {
		const buildTaskArgs = await this.$gradleBuildArgsService.getBuildTaskArgs(
			buildData
		);
		if (buildData.buildFilterDevicesArch) {
			let devices = this.$devicesService.getDevicesForPlatform(buildData.platform);
			if(buildData.emulator) {
				devices = devices.filter(d=>d.isEmulator);
			}
			const abis = devices.map(d=>d.deviceInfo.abis.filter(a=>!!a && a.length)[0]).filter(a=>!!a);
			if (abis.length > 0 && buildTaskArgs.findIndex(b=>b.startsWith('-PabiFilters')) === -1) {
				buildTaskArgs.push(`-PabiFilters=${abis.join(',')}`);
			}
		}
		console.log('buildTaskArgs', buildTaskArgs);
		const spawnOptions = {
			emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME },
			throwError: true,
		};
		const gradleCommandOptions = {
			cwd: projectRoot,
			message: "Gradle build...",
			stdio: buildData.buildOutputStdio,
			gradlePath: buildData.gradlePath,
			spawnOptions,
		};

		await attachAwaitDetach(
			constants.BUILD_OUTPUT_EVENT_NAME,
			this.$childProcess,
			(data: any) => this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data),
			this.$gradleCommandService.executeCommand(
				buildTaskArgs,
				gradleCommandOptions
			)
		);
	}

	public async cleanProject(
		projectRoot: string,
		buildData: IAndroidBuildData
	): Promise<void> {
		const cleanTaskArgs = this.$gradleBuildArgsService.getCleanTaskArgs(
			buildData
		);
		const gradleCommandOptions = {
			cwd: projectRoot,
			message: "Gradle clean...",
			gradlePath: buildData.gradlePath,
		};
		await this.$gradleCommandService.executeCommand(
			cleanTaskArgs,
			gradleCommandOptions
		);
	}
}
injector.register("gradleBuildService", GradleBuildService);
