import * as emailValidator from "email-validator";
import * as queryString from "querystring";
import * as helpers from "../common/helpers";

export class SubscriptionService implements ISubscriptionService {
	constructor(private $httpClient: Server.IHttpClient,
		private $prompter: IPrompter,
		private $userSettingsService: IUserSettingsService,
		private $logger: ILogger) {
	}

	public async subscribeForNewsletter(): Promise<void> {
		if (await this.shouldAskForEmail()) {
			this.$logger.out("Leave your e-mail address here to subscribe for NativeScript newsletter and product updates, tips and tricks:");
			const email = await this.getEmail("(press Enter for blank)");
			await this.$userSettingsService.saveSetting("EMAIL_REGISTERED", true);
			await this.sendEmail(email);
		}
	}

	/**
	 * Checks whether we should ask the current user if they want to subscribe to NativeScript newsletter.
	 * NOTE: This method is protected, not private, only because of our unit tests.
	 * @returns {Promise<boolean>}
	 */
	protected async shouldAskForEmail(): Promise<boolean> {
		return helpers.isInteractive() && process.env.CLI_NOPROMPT !== "1" && !(await this.$userSettingsService.getSettingValue("EMAIL_REGISTERED"));
	}

	private async getEmail(prompt: string, options?: IPrompterOptions): Promise<string> {
		const schema: IPromptSchema = {
			message: prompt,
			type: "input",
			name: "inputEmail",
			validate: (value: any) => {
				if (value === "" || emailValidator.validate(value)) {
					return true;
				}

				return "Please provide a valid e-mail or simply leave it blank.";
			}
		};

		const result = await this.$prompter.get([schema]);
		return result.inputEmail;
	}

	private async sendEmail(email: string): Promise<void> {
		if (email) {
			const postData = queryString.stringify({
				'elqFormName': "dev_uins_cli",
				'elqSiteID': '1325',
				'emailAddress': email,
				'elqCookieWrite': '0'
			});

			const options = {
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

$injector.register("subscriptionService", SubscriptionService);
