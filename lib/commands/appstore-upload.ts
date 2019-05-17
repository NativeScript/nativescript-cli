import * as path from "path";
import { StringCommandParameter } from "../common/command-params";
import { BuildController } from "../controllers/build-controller";
import { IOSBuildData } from "../data/build-data";

export class PublishIOS implements ICommand {
	public allowedParameters: ICommandParameter[] = [new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector),
	new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector)];

	constructor(
		private $injector: IInjector,
		private $itmsTransporterService: IITMSTransporterService,
		private $logger: ILogger,
		private $projectData: IProjectData,
		private $options: IOptions,
		private $prompter: IPrompter,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $hostInfo: IHostInfo,
		private $errors: IErrors,
		private $buildController: BuildController,
		private $platformValidationService: IPlatformValidationService
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		let username = args[0];
		let password = args[1];
		const mobileProvisionIdentifier = args[2];
		const codeSignIdentity = args[3];
		let ipaFilePath = this.$options.ipa ? path.resolve(this.$options.ipa) : null;

		if (!username) {
			username = await this.$prompter.getString("Apple ID", { allowEmpty: false });
		}

		if (!password) {
			password = await this.$prompter.getPassword("Apple ID password");
		}

		if (!mobileProvisionIdentifier && !ipaFilePath) {
			this.$logger.warn("No mobile provision identifier set. A default mobile provision will be used. You can set one in app/App_Resources/iOS/build.xcconfig");
		}

		if (!codeSignIdentity && !ipaFilePath) {
			this.$logger.warn("No code sign identity set. A default code sign identity will be used. You can set one in app/App_Resources/iOS/build.xcconfig");
		}

		this.$options.release = true;
		const platform = this.$devicePlatformsConstants.iOS.toLowerCase();

		if (!ipaFilePath) {
			// No .ipa path provided, build .ipa on out own.
			if (mobileProvisionIdentifier || codeSignIdentity) {
				// This is not very correct as if we build multiple targets we will try to sign all of them using the signing identity here.
				this.$logger.info("Building .ipa with the selected mobile provision and/or certificate.");

				// As we need to build the package for device
				this.$options.forDevice = true;

				const buildData = new IOSBuildData(this.$projectData.projectDir, platform, this.$options);
				ipaFilePath = await this.$buildController.prepareAndBuild(buildData);
			} else {
				this.$logger.info("No .ipa, mobile provision or certificate set. Perfect! Now we'll build .xcarchive and let Xcode pick the distribution certificate and provisioning profile for you when exporting .ipa for AppStore submission.");
				const buildData = new IOSBuildData(this.$projectData.projectDir, platform, { ...this.$options, buildForAppStore: true });
				ipaFilePath = await this.$buildController.prepareAndBuild(buildData);
				this.$logger.info(`Export at: ${ipaFilePath}`);
			}
		}

		await this.$itmsTransporterService.upload({
			username,
			password,
			ipaFilePath,
			shouldExtractIpa: !!this.$options.ipa,
			verboseLogging: this.$logger.getLevel() === "TRACE"
		});
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$hostInfo.isDarwin) {
			this.$errors.failWithoutHelp("iOS publishing is only available on Mac OS X.");
		}

		if (!this.$platformValidationService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
		}

		return true;
	}
}

$injector.registerCommand(["publish|ios", "appstore|upload"], PublishIOS);
