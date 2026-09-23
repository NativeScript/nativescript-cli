import * as path from "path";
import { IHostInfo } from "../common/declarations";
import {
	booleanOption,
	Command,
	CommandOptionsSchema,
	objectOption,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { BuildController } from "../controllers/build-controller";
import { IOSBuildData } from "../data/build-data";
import {
	IITMSTransporterService,
	IOptions,
	IPlatformValidationService,
} from "../declarations";
import { IApplePortalSessionService } from "../services/apple-portal/definitions";
import { ProjectData } from "../contracts/project-data";
import { provideProject } from "./command-base";

const publishIOSCommandOptions = {
	appleApplicationSpecificPassword: stringOption(),
	appleSessionBase64: stringOption(),
	ipa: stringOption(),
	provision: objectOption(),
	release: booleanOption(),
	teamId: objectOption(),
} satisfies CommandOptionsSchema;

export class PublishIOSCommand extends Command({
	name: ["publish|ios", "appstore|upload"],
	description: "Uploads a project to App Store Connect.",
	options: publishIOSCommandOptions,
	// Arguments have never been rejected here, only ignored past the third.
	arguments: "any",
	providers: [provideProject()],
}) {
	private $applePortalSessionService = inject<IApplePortalSessionService>(
		"applePortalSessionService",
	);
	private $buildController = inject<BuildController>("buildController");
	private $devicePlatformsConstants = inject<Mobile.IDevicePlatformsConstants>(
		"devicePlatformsConstants",
	);
	private $hostInfo = inject<IHostInfo>("hostInfo");
	private $itmsTransporterService = inject<IITMSTransporterService>(
		"itmsTransporterService",
	);
	private $logger = inject<ILogger>("logger");
	private $options = inject<IOptions>("options");
	private $platformValidationService = inject<IPlatformValidationService>(
		"platformValidationService",
	);
	private $projectData = inject(ProjectData);
	private $prompter = inject<IPrompter>("prompter");

	public canExecute(): boolean {
		if (!this.$hostInfo.isDarwin) {
			this.context.fail("iOS publishing is only available on macOS.", {
				help: false,
			});
		}

		if (
			!this.$platformValidationService.isPlatformSupportedForOS(
				this.$devicePlatformsConstants.iOS,
				this.$projectData,
			)
		) {
			this.context.fail(
				`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`,
				{ help: false },
			);
		}

		return true;
	}

	public async run(): Promise<void> {
		await this.$itmsTransporterService.validate(
			this.options.appleApplicationSpecificPassword,
		);

		const username =
			this.args[0] ||
			(await this.$prompter.getString("Apple ID", { allowEmpty: false }));

		const password =
			this.args[1] || (await this.$prompter.getPassword("Apple ID password"));

		const user = await this.createUserSession(username, password);

		const mobileProvisionIdentifier = this.options.provision ?? this.args[2];

		let ipaFilePath = this.options.ipa ? path.resolve(this.options.ipa) : null;

		if (!mobileProvisionIdentifier && !ipaFilePath) {
			this.$logger.warn(
				"No mobile provision identifier set. A default mobile provision will be used. You can set one in app/App_Resources/iOS/build.xcconfig",
			);
		}

		// The build data is spread off the parsed command line, so the flags the
		// upload implies have to be set on the options service rather than on the
		// context, which is a copy.
		this.$options.release = true;

		if (!ipaFilePath) {
			ipaFilePath = await this.buildIpa(mobileProvisionIdentifier);
		}

		await this.$itmsTransporterService.upload({
			credentials: { username, password },
			user,
			applicationSpecificPassword:
				this.options.appleApplicationSpecificPassword,
			ipaFilePath,
			shouldExtractIpa: !!this.options.ipa,
			verboseLogging: this.$logger.getLevel() === "TRACE",
			teamId: this.options.teamId,
		});
	}

	private async createUserSession(username: string, password: string) {
		const user = await this.$applePortalSessionService.createUserSession(
			{ username, password },
			{
				applicationSpecificPassword:
					this.options.appleApplicationSpecificPassword,
				sessionBase64: this.options.appleSessionBase64,
				requireInteractiveConsole: true,
				requireApplicationSpecificPassword: true,
			},
		);
		if (!user.areCredentialsValid) {
			this.context.fail(
				`Invalid username and password combination. Used '${username}' as the username.`,
				{ help: false },
			);
		}

		return user;
	}

	private async buildIpa(mobileProvisionIdentifier: string): Promise<string> {
		const platform = this.$devicePlatformsConstants.iOS.toLowerCase();
		// No .ipa path provided, build .ipa on out own.
		if (mobileProvisionIdentifier) {
			// This is not very correct as if we build multiple targets we will try to sign all of them using the signing identity here.
			this.$logger.info(
				"Building .ipa with the selected mobile provision and/or certificate. " +
					mobileProvisionIdentifier,
			);

			this.$options.provision = mobileProvisionIdentifier;

			const buildData = new IOSBuildData(
				this.$projectData.projectDir,
				platform,
				{ ...this.$options.argv, buildForAppStore: true, watch: false },
			);
			return await this.$buildController.prepareAndBuild(buildData);
		} else {
			this.$logger.info(
				"No .ipa, mobile provision or certificate set. Perfect! Now we'll build .xcarchive and let Xcode pick the distribution certificate and provisioning profile for you when exporting .ipa for AppStore submission.",
			);
			const buildData = new IOSBuildData(
				this.$projectData.projectDir,
				platform,
				{ ...this.$options.argv, buildForAppStore: true, watch: false },
			);
			const ipaFilePath =
				await this.$buildController.prepareAndBuild(buildData);
			this.$logger.info(`Export at: ${ipaFilePath}`);
			return ipaFilePath;
		}
	}
}
