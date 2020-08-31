import { EOL } from "os";
import { LoggerConfigData } from "../constants";
import { IProjectConfigService } from "../definitions/project";
import { injector } from "../common/yok";

const enum MarkingMode {
	None = "none",
	Full = "full",
}

const MARKING_MODE_PROP = "markingMode";
const MARKING_MODE_FULL_DEPRECATION_MSG = `In NativeScript 7.0 "${MARKING_MODE_PROP}:${MarkingMode.Full}" is no longer supported.`;

export class MarkingModeService implements IMarkingModeService {
	constructor(
		private $logger: ILogger,
		private $projectConfigService: IProjectConfigService
	) {}

	public async handleMarkingModeFullDeprecation(
		options: IMarkingModeFullDeprecationOptions
	): Promise<void> {
		const markingModeValue = this.$projectConfigService.getValue(
			"android.markingMode"
		);

		const { skipWarnings, forceSwitch } = options;

		if (forceSwitch) {
			this.setMarkingMode(MarkingMode.None);
			return;
		}

		if (!skipWarnings && markingModeValue.toLowerCase() !== MarkingMode.None) {
			this.showMarkingModeFullWarning();
		}
	}

	private setMarkingMode(newMode: string) {
		this.$projectConfigService.setValue("android.markingMode", newMode);
	}

	private showMarkingModeFullWarning() {
		const markingModeFullWarning = `You are using the deprecated "${MARKING_MODE_PROP}:${MarkingMode.Full}".${EOL}${EOL}${MARKING_MODE_FULL_DEPRECATION_MSG}${EOL}${EOL}You should update your marking mode by executing 'tns update --markingMode'.`;

		this.$logger.warn(markingModeFullWarning, {
			[LoggerConfigData.wrapMessageWithBorders]: true,
		});
	}
}

injector.register("markingModeService", MarkingModeService);
