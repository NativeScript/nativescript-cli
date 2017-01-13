import { StringCommandParameter } from "../common/command-params";
import * as path from "path";
import { IOSProjectService } from "../services/ios-project-service";

export class PublishIOS implements ICommand {
	public allowedParameters: ICommandParameter[] = [new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector),
	new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector)];

	constructor(private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $injector: IInjector,
		private $itmsTransporterService: IITMSTransporterService,
		private $logger: ILogger,
		private $options: IOptions,
		private $prompter: IPrompter,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	private get $platformsData(): IPlatformsData {
		return this.$injector.resolve("platformsData");
	}

	// This property was introduced due to the fact that the $platformService dependency
	// ultimately tries to resolve the current project's dir and fails if not executed from within a project
	private get $platformService(): IPlatformService {
		return this.$injector.resolve("platformService");
	}

	public async execute(args: string[]): Promise<void> {
		let username = args[0],
			password = args[1],
			mobileProvisionIdentifier = args[2],
			codeSignIdentity = args[3],
			teamID = this.$options.teamId,
			ipaFilePath = this.$options.ipa ? path.resolve(this.$options.ipa) : null;

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

		if (!ipaFilePath) {
			let platform = this.$devicePlatformsConstants.iOS;
			// No .ipa path provided, build .ipa on out own.
			if (mobileProvisionIdentifier || codeSignIdentity) {
				let iOSBuildConfig: IiOSBuildConfig = {
					buildForDevice: true,
					mobileProvisionIdentifier,
					codeSignIdentity
				};
				this.$logger.info("Building .ipa with the selected mobile provision and/or certificate.");
				// This is not very correct as if we build multiple targets we will try to sign all of them using the signing identity here.
				await this.$platformService.preparePlatform(platform);
				await this.$platformService.buildPlatform(platform, iOSBuildConfig);
				ipaFilePath = this.$platformService.lastOutputPath(platform, { isForDevice: iOSBuildConfig.buildForDevice });
			} else {
				this.$logger.info("No .ipa, mobile provision or certificate set. Perfect! Now we'll build .xcarchive and let Xcode pick the distribution certificate and provisioning profile for you when exporting .ipa for AppStore submission.");
				await this.$platformService.preparePlatform(platform);

				let platformData = this.$platformsData.getPlatformData(platform);
				let iOSProjectService = <IOSProjectService>platformData.platformProjectService;

				let archivePath = await iOSProjectService.archive(platformData.projectRoot);
				this.$logger.info("Archive at: " + archivePath);

				let exportPath = await iOSProjectService.exportArchive({ archivePath, teamID });
				this.$logger.info("Export at: " + exportPath);

				ipaFilePath = exportPath;
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
		if (!this.$hostInfo.isDarwin) {
			this.$errors.failWithoutHelp("This command is only available on Mac OS X.");
		}

		return true;
	}
}

$injector.registerCommand(["publish|ios", "appstore|upload"], PublishIOS);
