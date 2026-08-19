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
import * as _ from "lodash";

export class GradleBuildService
	extends EventEmitter
	implements IGradleBuildService {
	constructor(
		private $childProcess: IChildProcess,
		private $devicesService: Mobile.IDevicesService,
		private $gradleBuildArgsService: IGradleBuildArgsService,
		private $gradleCommandService: IGradleCommandService
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

		this.applyDevicesAbiFilter(buildTaskArgs, buildData);

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

	/**
	 * Narrows the native build down to the ABIs of the devices this build is
	 * about to be deployed to. The app's gradle configuration decides what to do
	 * with `abiFilters` - typically an `ndk.abiFilters`/`splits` block in
	 * `App_Resources/Android/app.gradle`. An explicitly passed `-PabiFilters`
	 * always wins.
	 */
	private applyDevicesAbiFilter(
		buildTaskArgs: string[],
		buildData: IAndroidBuildData
	): void {
		if (!buildData.buildFilterDevicesArch) {
			return;
		}

		if (_.some(buildTaskArgs, (arg) => arg.startsWith("-PabiFilters"))) {
			return;
		}

		let devices = this.$devicesService.getDevicesForPlatform(
			buildData.platform
		);
		if (buildData.device) {
			devices = devices.filter(
				(d) => d.deviceInfo.identifier === buildData.device
			);
		} else if (buildData.emulator) {
			devices = devices.filter((d) => d.isEmulator);
		}

		const abis = _.uniq(
			devices
				.map((d) => (d.deviceInfo.abis || [])[0])
				.filter((abi) => !!abi)
		);

		if (abis.length) {
			buildTaskArgs.push(`-PabiFilters=${abis.join(",")}`);
		}
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
