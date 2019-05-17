import { createTable } from "../common/helpers";
import { StringCommandParameter } from "../common/command-params";

export class ListiOSApps implements ICommand {
	public allowedParameters: ICommandParameter[] = [new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector)];

	constructor(private $injector: IInjector,
		private $itmsTransporterService: IITMSTransporterService,
		private $logger: ILogger,
		private $projectData: IProjectData,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $platformValidationService: IPlatformValidationService,
		private $errors: IErrors,
		private $prompter: IPrompter) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		if (!this.$platformValidationService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
		}

		let username = args[0];
		let password = args[1];

		if (!username) {
			username = await this.$prompter.getString("Apple ID", { allowEmpty: false });
		}

		if (!password) {
			password = await this.$prompter.getPassword("Apple ID password");
		}

		const iOSApplications = await this.$itmsTransporterService.getiOSApplications({ username, password });

		if (!iOSApplications || !iOSApplications.length) {
			this.$logger.out("Seems you don't have any applications yet.");
		} else {
			const table: any = createTable(["Application Name", "Bundle Identifier", "Version"], iOSApplications.map(element => {
				return [element.name, element.bundleId, element.version];
			}));

			this.$logger.out(table.toString());
		}
	}
}

$injector.registerCommand("appstore|*list", ListiOSApps);
