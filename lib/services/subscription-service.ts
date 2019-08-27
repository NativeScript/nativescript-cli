import * as emailValidator from "email-validator";
import * as queryString from "querystring";
import * as helpers from "../common/helpers";
import * as prompt from "inquirer";
import { SubscribeForNewsletterMessages } from "../constants";

export class SubscriptionService implements ISubscriptionService {
	constructor(private $httpClient: Server.IHttpClient,
		private $prompter: IPrompter,
		private $userSettingsService: IUserSettingsService,
		private $logger: ILogger) {
	}

	public async subscribeForNewsletter(): Promise<void> {
		if (await this.shouldAskForEmail()) {
			this.$logger.printMarkdown(SubscribeForNewsletterMessages.ReviewPrivacyPolicyMsg);
			this.$logger.printMarkdown(SubscribeForNewsletterMessages.AgreeToReceiveEmailMsg);

			const email = await this.getEmail(SubscribeForNewsletterMessages.PromptMsg);
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

	private async getEmail(message: string, options?: IPrompterOptions): Promise<string> {
		const schema: prompt.Question = {
			message,
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
				'elqFormName': "NativeScript_IncludeinEmail",
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
