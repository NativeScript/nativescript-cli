import { TrackActionNames } from "../constants";
import { hook } from "../common/helpers";
import { EOL } from "os";
import {
	IPlatformEnvironmentRequirements,
	ICheckEnvironmentRequirementsInput,
	ICheckEnvironmentRequirementsOutput,
} from "../definitions/platform";
import {
	IErrors,
	IAnalyticsService,
	IDoctorService,
} from "../common/declarations";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";

export class PlatformEnvironmentRequirements
	implements IPlatformEnvironmentRequirements {
	constructor(
		private $doctorService: IDoctorService,
		private $errors: IErrors,
		private $analyticsService: IAnalyticsService,
		// @ts-ignore - required by the hook helper!
		private $injector: IInjector
	) {}

	private static MISSING_LOCAL_SETUP_MESSAGE =
		"Your environment is not configured properly and you will not be able to execute local builds.";

	@hook("checkEnvironment")
	public async checkEnvironmentRequirements(
		input: ICheckEnvironmentRequirementsInput
	): Promise<ICheckEnvironmentRequirementsOutput> {
		const { platform, projectDir, runtimeVersion } = input;

		const selectedOption: any = null;

		if (process.env.NS_SKIP_ENV_CHECK) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.CheckEnvironmentRequirements,
				additionalData: "Skipped: NS_SKIP_ENV_CHECK is set",
			});
			return {
				canExecute: true,
				selectedOption,
			};
		}

		const canExecute = await this.$doctorService.canExecuteLocalBuild({
			platform,
			projectDir,
			runtimeVersion,
			forceCheck: input.forceCheck,
		});

		if (!canExecute) {
			// if (!isInteractive()) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.CheckEnvironmentRequirements,
				additionalData:
					"Non-interactive terminal, unable to execute local builds.",
			});
			this.fail(this.getNonInteractiveConsoleMessage(platform));
		}

		return {
			canExecute,
			selectedOption,
		};
	}

	private fail(message: string): void {
		this.$errors.fail({ formatStr: message, printOnStdout: true });
	}

	private getNonInteractiveConsoleMessage(platform: string) {
		return [
			PlatformEnvironmentRequirements.MISSING_LOCAL_SETUP_MESSAGE,
			this.getEnvVerificationMessage(platform),
		].join(EOL);
	}

	private getEnvVerificationMessage(platform: string) {
		// map process.platform to OS name used in docs
		const os = ({
			linux: "linux",
			win32: "windows",
			darwin: "macos",
		} as any)[process.platform];

		const anchor = platform ? `#${os}-${platform.toLowerCase()}` : "";

		return (
			`Verify that your environment is configured according to the system requirements described at\n` +
			`https://docs.nativescript.org/environment-setup.html${anchor}.`
		);
	}
}

injector.register(
	"platformEnvironmentRequirements",
	PlatformEnvironmentRequirements
);
