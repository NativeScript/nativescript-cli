import { $injector } from "../definitions/yok";
import { IUserSettingsService, IErrors } from "../declarations";
import { ICommand, ICommandParameter } from "../definitions/commands";

export class PackageManagerGetCommand implements ICommand {

	constructor(
		private $errors: IErrors,
		private $logger: ILogger,
		private $userSettingsService: IUserSettingsService
	) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		if (args && args.length) {
			this.$errors.failWithHelp(`The arguments '${args.join(" ")}' are not valid for the 'package-manager get' command.`);
		}

		const result = await this.$userSettingsService.getSettingValue("packageManager");
		this.$logger.printMarkdown(`Your current package manager is \`${result || "npm"}\`.`);
	}
}

$injector.registerCommand("package-manager|*get", PackageManagerGetCommand);
