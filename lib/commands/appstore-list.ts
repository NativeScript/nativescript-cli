import { createTable } from "../common/helpers";
import {StringCommandParameter} from "../common/command-params";

export class ListiOSApps implements ICommand {
	constructor(private $injector: IInjector,
		private $itmsTransporterService: IITMSTransporterService,
		private $logger: ILogger,
		private $prompter: IPrompter,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public allowedParameters: ICommandParameter[] = [new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector)];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let username = args[0],
				password = args[1];

			if(!username) {
				username = this.$prompter.getString("Apple ID", { allowEmpty: false }).wait();
			}

			if(!password) {
				password = this.$prompter.getPassword("Apple ID password").wait();
			}

			let iOSApplications = this.$itmsTransporterService.getiOSApplications({username, password}).wait();

			if (!iOSApplications || !iOSApplications.length) {
				this.$logger.out("Seems you don't have any applications yet.");
			} else {
				let table: any = createTable(["Application Name", "Bundle Identifier", "Version"], iOSApplications.map(element => {
					return [element.name, element.bundleId, element.version];
				}));

				this.$logger.out(table.toString());
			}
		}).future<void>()();
	}
}

$injector.registerCommand("appstore|*list", ListiOSApps);
