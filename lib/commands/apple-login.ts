import { StringCommandParameter } from "../common/command-params";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { IErrors } from "../common/declarations";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { IApplePortalSessionService } from "../services/apple-portal/definitions";

export class AppleLogin implements ICommand {
	public allowedParameters: ICommandParameter[] = [new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector)];

	constructor(
		private $applePortalSessionService: IApplePortalSessionService,
		private $errors: IErrors,
		private $injector: IInjector,
		private $logger: ILogger,
		private $prompter: IPrompter
	) { }

	public async execute(args: string[]): Promise<void> {
		let username = args[0];
		if (!username) {
			username = await this.$prompter.getString("Apple ID", { allowEmpty: false });
		}

		let password = args[1];
		if (!password) {
			password = await this.$prompter.getPassword("Apple ID password");
		}

		const user = await this.$applePortalSessionService.createUserSession({ username, password });
		if (!user.areCredentialsValid) {
			this.$errors.fail(`Invalid username and password combination. Used '${username}' as the username.`);
		}

		const output = Buffer.from(user.userSessionCookie).toString("base64");
		this.$logger.info(output);
	}
}
injector.registerCommand("apple-login", AppleLogin);
