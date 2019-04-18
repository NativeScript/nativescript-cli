import { StringCommandParameter } from "../common/command-params";
import * as path from "path";
import { IOSProjectService } from "../services/ios-project-service";

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
		private $errors: IErrors) {
		this.$projectData.initializeProjectData();
	}

	private get $platformsData(): IPlatformsData {
		return this.$injector.resolve("platformsData");
	}

	// This property was introduced due to the fact that the $platformService dependency
	// ultimately tries to resolve the current project's dir and fails if not executed from within a project
	private get $platformService(): IPlatformService {
		return this.$injector.resolve("platformService");
	}

	public async execute(args: string[]): Promise<void> {
		let username = args[0];
		let password = args[1];
		const mobileProvisionIdentifier = args[2];
		const codeSignIdentity = args[3];
		const teamID = this.$options.teamId;
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

		if (!ipaFilePath) {
			const platform = this.$devicePlatformsConstants.iOS;
			// No .ipa path provided, build .ipa on out own.
			const appFilesUpdaterOptions: IAppFilesUpdaterOptions = {
				bundle: !!this.$options.bundle,
				release: this.$options.release,
				useHotModuleReload: false
			};
			const platformInfo: IPreparePlatformInfo = {
				platform,
				appFilesUpdaterOptions,
				platformTemplate: this.$options.platformTemplate,
				projectData: this.$projectData,
				config: this.$options,
				env: this.$options.env
			};

			if (mobileProvisionIdentifier || codeSignIdentity) {
				const iOSBuildConfig: IBuildConfig = {
					projectDir: this.$options.path,
					release: this.$options.release,
					device: this.$options.device,
					provision: this.$options.provision,
					teamId: this.$options.teamId,
					buildForDevice: true,
					mobileProvisionIdentifier,
					codeSignIdentity
				};
				this.$logger.info("Building .ipa with the selected mobile provision and/or certificate.");
				// This is not very correct as if we build multiple targets we will try to sign all of them using the signing identity here.
				await this.$platformService.preparePlatform(platformInfo);
				await this.$platformService.buildPlatform(platform, iOSBuildConfig, this.$projectData);
				ipaFilePath = this.$platformService.lastOutputPath(platform, iOSBuildConfig, this.$projectData);
			} else {
				this.$logger.info("No .ipa, mobile provision or certificate set. Perfect! Now we'll build .xcarchive and let Xcode pick the distribution certificate and provisioning profile for you when exporting .ipa for AppStore submission.");
				await this.$platformService.preparePlatform(platformInfo);

				const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
				const iOSProjectService = <IOSProjectService>platformData.platformProjectService;

				const archivePath = await iOSProjectService.archive(this.$projectData);
				this.$logger.info("Archive at: " + archivePath);

				const exportPath = await iOSProjectService.exportArchive(this.$projectData, { archivePath, teamID, provision: mobileProvisionIdentifier || this.$options.provision });
				this.$logger.info("Export at: " + exportPath);

				ipaFilePath = exportPath;
			}
		}

		await this.$itmsTransporterService.upload({
			username,
			password,
			ipaFilePath,
			ipaFileOption: !!this.$options.ipa,
			verboseLogging: this.$logger.getLevel() === "TRACE"
		});
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$hostInfo.isDarwin) {
			this.$errors.failWithoutHelp("iOS publishing is only available on Mac OS X.");
		}

		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
		}

		return true;
	}
}

$injector.registerCommand(["publish|ios", "appstore|upload"], PublishIOS);
