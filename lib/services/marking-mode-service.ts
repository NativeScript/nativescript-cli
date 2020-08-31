import * as helpers from "../common/helpers";
import { EOL } from "os";
import { LoggerConfigData } from "../constants";
import { IProjectConfigService } from "../definitions/project";
import { injector } from "../common/yok";

const enum MarkingMode {
	None = "none",
	Full = "full",
}

const MARKING_MODE_PROP = "markingMode";
const MARKING_MODE_FULL_DEPRECATION_MSG = `With the upcoming NativeScript 7.0 the "${MARKING_MODE_PROP}:${MarkingMode.None}" will become the only marking mode supported by the Android Runtime.`;
const MARKING_MODE_NONE_CONFIRM_MSG = `Do you want to switch your app to the recommended "${MARKING_MODE_PROP}:${MarkingMode.None}"?
More info about the reasons for this change can be found in the link below:
https://www.nativescript.org/blog/markingmode-none-is-official-boost-android-performance-while-avoiding-memory-issues`;

export class MarkingModeService implements IMarkingModeService {
	constructor(
		private $logger: ILogger,
		private $projectConfigService: IProjectConfigService,
		private $prompter: IPrompter
	) {}

	public async handleMarkingModeFullDeprecation(
		options: IMarkingModeFullDeprecationOptions
	): Promise<void> {
		let markingModeValue = this.$projectConfigService.getValue(
			"android.markingMode"
		);
		const { skipWarnings, forceSwitch } = options;

		if (forceSwitch) {
			this.setMarkingMode(MarkingMode.None);
			return;
		}

		if (!markingModeValue && helpers.isInteractive()) {
			this.$logger.info();
			this.$logger.printMarkdown(`
__Improve your app by switching to "${MARKING_MODE_PROP}:${MarkingMode.None}".__

\`${MARKING_MODE_FULL_DEPRECATION_MSG}\``);
			const hasSwitched = await this.$prompter.confirm(
				MARKING_MODE_NONE_CONFIRM_MSG,
				() => true
			);

			markingModeValue = hasSwitched ? MarkingMode.None : MarkingMode.Full;
			this.setMarkingMode(markingModeValue);
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
