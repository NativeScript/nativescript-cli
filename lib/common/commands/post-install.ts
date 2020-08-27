import { injector } from "../yok";
import { ICommand, ICommandParameter } from "../definitions/commands";
import { IErrors } from "../declarations";

export class PostInstallCommand implements ICommand {
	constructor(protected $errors: IErrors) {}

	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$errors.fail(
			"This command is deprecated. Use `ns dev-post-install-cli` instead"
		);
	}
}
injector.registerCommand("dev-post-install", PostInstallCommand);
