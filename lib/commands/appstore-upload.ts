import * as path from "path";
import { StringCommandParameter } from "../common/command-params";
import { BuildPlatformService } from "../services/platform/build-platform-service";
import { WorkflowDataService } from "../services/workflow/workflow-data-service";
import { MainController } from "../controllers/main-controller";

export class PublishIOS implements ICommand {
	public allowedParameters: ICommandParameter[] = [new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector),
	new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector)];

	constructor(private $errors: IErrors,
		private $injector: IInjector,
		private $itmsTransporterService: IITMSTransporterService,
		private $logger: ILogger,
		private $projectData: IProjectData,
		private $options: IOptions,
		private $prompter: IPrompter,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $mainController: MainController,
		private $platformValidationService: IPlatformValidationService,
		private $buildPlatformService: BuildPlatformService,
		private $workflowDataService: WorkflowDataService
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

				const { nativePlatformData, buildPlatformData } = this.$workflowDataService.createWorkflowData(platform, this.$projectData.projectDir, this.$options);
				ipaFilePath = await this.$buildPlatformService.buildPlatform(nativePlatformData, this.$projectData, buildPlatformData);
			} else {
				this.$logger.info("No .ipa, mobile provision or certificate set. Perfect! Now we'll build .xcarchive and let Xcode pick the distribution certificate and provisioning profile for you when exporting .ipa for AppStore submission.");
				ipaFilePath = await this.$mainController.buildPlatform(platform, this.$projectData.projectDir, { ...this.$options, buildForAppStore: true })
				this.$logger.info(`Export at: ${ipaFilePath}`);
			}
		}

		await this.$itmsTransporterService.upload({
			username,
			password,
			ipaFilePath,
			verboseLogging: this.$logger.getLevel() === "TRACE"
		});
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$platformValidationService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
		}

		return true;
	}
}

$injector.registerCommand(["publish|ios", "appstore|upload"], PublishIOS);
