import { createTable } from "../common/helpers";
import { StringCommandParameter } from "../common/command-params";

export class ListiOSApps implements ICommand {
	public allowedParameters: ICommandParameter[] = [new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector)];

	constructor(private $injector: IInjector,
		private $itmsTransporterService: IITMSTransporterService,
		private $logger: ILogger,
		private $prompter: IPrompter) { }

	public async execute(args: string[]): Promise<void> {
		let username = args[0],
			password = args[1];

		if (!username) {
			username = await this.$prompter.getString("Apple ID", { allowEmpty: false });
		}

		if (!password) {
			password = await this.$prompter.getPassword("Apple ID password");
		}

		let iOSApplications = await this.$itmsTransporterService.getiOSApplications({ username, password });

		if (!iOSApplications || !iOSApplications.length) {
			this.$logger.out("Seems you don't have any applications yet.");
		} else {
			let table: any = createTable(["Application Name", "Bundle Identifier", "Version"], iOSApplications.map(element => {
				return [element.name, element.bundleId, element.version];
			}));

			this.$logger.out(table.toString());
		}
	}
}

$injector.registerCommand("appstore|*list", ListiOSApps);
