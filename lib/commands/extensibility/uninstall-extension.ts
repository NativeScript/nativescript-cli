import { ICommand, IStringParameterBuilder, ICommandParameter } from "../../common/definitions/commands";
import { $injector } from "../../common/definitions/yok";
import { IExtensibilityService } from "../../common/definitions/extensibility";

export class UninstallExtensionCommand implements ICommand {
	constructor(private $extensibilityService: IExtensibilityService,
		private $stringParameterBuilder: IStringParameterBuilder,
		private $logger: ILogger) { }

	public async execute(args: string[]): Promise<void> {
		const extensionName = args[0];
		await this.$extensibilityService.uninstallExtension(extensionName);
		this.$logger.info(`Successfully uninstalled extension ${extensionName}`);
	}

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("You have to provide a valid name for extension that you want to uninstall.")];
}
$injector.registerCommand("extension|uninstall", UninstallExtensionCommand);
