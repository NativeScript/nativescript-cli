import { EOL } from "os";
import { LoggerConfigData, PlatformTypes } from "../constants";
import {
	IProjectConfigService,
	IProjectDataService,
} from "../definitions/project";
import { injector } from "../common/yok";
import { IProjectHelper } from "../common/declarations";
import semver = require("semver/preload");

const enum MarkingMode {
	None = "none",
	Full = "full",
}

const MARKING_MODE_PROP = "markingMode";
const MARKING_MODE_FULL_DEPRECATION_MSG = `In NativeScript 8.0 "${MARKING_MODE_PROP}:${MarkingMode.Full}" is no longer supported.`;

export class MarkingModeService implements IMarkingModeService {
	constructor(
		private $logger: ILogger,
		private $projectConfigService: IProjectConfigService,
		private $projectHelper: IProjectHelper,
		private $projectDataService: IProjectDataService
	) {}

	public async handleMarkingModeFullDeprecation(
		options: IMarkingModeFullDeprecationOptions
	): Promise<void> {
		const markingModeValue = this.$projectConfigService.getValue(
			"android.markingMode"
		);

		const { skipWarnings, forceSwitch } = options;

		if (forceSwitch) {
			await this.setMarkingMode(MarkingMode.None);
			return;
		}

		if (!skipWarnings && markingModeValue?.toLowerCase() !== MarkingMode.None) {
			// only warn if runtime is less than 7.0.0-rc.5 - where the default has been changed to None
			// if version is null - we are about to add the latest runtime, so no need to warn
			const { version } = this.$projectDataService.getRuntimePackage(
				this.$projectHelper.projectDir,
				PlatformTypes.android
			);
			const isMarkingModeFullDefault =
				version && semver.lt(semver.coerce(version), "7.0.0-rc.5");

			if (isMarkingModeFullDefault) {
				this.showMarkingModeFullWarning();
			}
		}
	}

	private async setMarkingMode(newMode: string) {
		await this.$projectConfigService.setValue("android.markingMode", newMode);
	}

	private showMarkingModeFullWarning() {
		const markingModeFullWarning = `You are using the deprecated "${MARKING_MODE_PROP}:${MarkingMode.Full}".${EOL}${EOL}${MARKING_MODE_FULL_DEPRECATION_MSG}${EOL}${EOL}You should update your marking mode by executing 'ns update --markingMode'.`;

		this.$logger.warn(markingModeFullWarning, {
			[LoggerConfigData.wrapMessageWithBorders]: true,
		});
	}
}

injector.register("markingModeService", MarkingModeService);
