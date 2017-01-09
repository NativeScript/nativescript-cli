import { PostInstallCommand } from "../common/commands/post-install";
import * as emailValidator from "email-validator";
import * as queryString from "querystring";
import * as helpers from "../common/helpers";

export class PostInstallCliCommand extends PostInstallCommand {
	private logger: ILogger;

	constructor($fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $prompter: IPrompter,
		private $userSettingsService: IUserSettingsService,
		$staticConfig: Config.IStaticConfig,
		$commandsService: ICommandsService,
		$htmlHelpService: IHtmlHelpService,
		$options: ICommonOptions,
		$doctorService: IDoctorService,
		$analyticsService: IAnalyticsService,
		$logger: ILogger) {
		super($fs, $staticConfig, $commandsService, $htmlHelpService, $options, $doctorService, $analyticsService, $logger);
		this.logger = $logger;
	}

	public async execute(args: string[]): Promise<void> {
		await super.execute(args);

		if (await this.shouldAskForEmail()) {
			this.logger.out("Leave your e-mail address here to subscribe for NativeScript newsletter and product updates, tips and tricks:");
			let email = await this.getEmail("(press Enter for blank)");
			await this.$userSettingsService.saveSetting("EMAIL_REGISTERED", true);
			await this.sendEmail(email);
		}
	}

	private async shouldAskForEmail(): Promise<boolean> {
		return helpers.isInteractive() && await process.env.CLI_NOPROMPT !== "1" && !this.$userSettingsService.getSettingValue("EMAIL_REGISTERED");
	}

	private async getEmail(prompt: string, options?: IPrompterOptions): Promise<string> {
		let schema: IPromptSchema = {
			message: prompt,
			type: "input",
			name: "inputEmail",
			validate: (value: any) => {
				if (value === "" || emailValidator.validate(value)) {
					return true;
				}
				return "Please provide a valid e-mail or simply leave it blank.";
			},
			default: options && options.defaultAction
		};

		let result = await this.$prompter.get([schema]);
		return result.inputEmail;
	}

	private async sendEmail(email: string): Promise<void> {
		if (email) {
			let postData = queryString.stringify({
				'elqFormName': "dev_uins_cli",
				'elqSiteID': '1325',
				'emailAddress': email,
				'elqCookieWrite': '0'
			});

			let options = {
				url: 'https://s1325.t.eloqua.com/e/f2',
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': postData.length
				},
				body: postData
			};

			await this.$httpClient.httpRequest(options);
		}
	}
}

$injector.registerCommand("post-install-cli", PostInstallCliCommand);
