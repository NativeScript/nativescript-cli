import {
	ICommand,
	IStringParameterBuilder,
	ICommandParameter,
} from "../../common/definitions/commands";
import { injector } from "../../common/yok";
import { IExtensibilityService } from "../../common/definitions/extensibility";

export class InstallExtensionCommand implements ICommand {
	constructor(
		private $extensibilityService: IExtensibilityService,
		private $stringParameterBuilder: IStringParameterBuilder,
		private $logger: ILogger
	) {}

	public async execute(args: string[]): Promise<void> {
		const extensionData = await this.$extensibilityService.installExtension(
			args[0]
		);
		this.$logger.info(
			`Successfully installed extension ${extensionData.extensionName}.`
		);

		await this.$extensibilityService.loadExtension(extensionData.extensionName);
		this.$logger.info(
			`Successfully loaded extension ${extensionData.extensionName}.`
		);
	}

	allowedParameters: ICommandParameter[] = [
		this.$stringParameterBuilder.createMandatoryParameter(
			"You have to provide a valid name for extension that you want to install."
		),
	];
}
injector.registerCommand("extension|install", InstallExtensionCommand);
