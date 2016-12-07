import {PostInstallCommand} from "../common/commands/post-install";
import * as emailValidator  from "email-validator";
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

	public execute(args: string[]): IFuture<void> {
		return (() => {
			super.execute(args).wait();

			if (this.shouldAskForEmail()) {
				this.logger.out("Leave your e-mail address here to subscribe for NativeScript newsletter and product updates, tips and tricks:");
 				let email = this.getEmail("(press Enter for blank)").wait();
				this.$userSettingsService.saveSetting("EMAIL_REGISTERED", true).wait();
 				this.sendEmail(email);
 			}
		}).future<void>()();
	}

	private shouldAskForEmail(): boolean {
		return helpers.isInteractive() && process.env.CLI_NOPROMPT !== "1" && !this.$userSettingsService.getSettingValue("EMAIL_REGISTERED").wait();
	}

	private getEmail(prompt: string, options?: IPrompterOptions): IFuture<string> {
		return (() => {
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

			let result = this.$prompter.get([schema]).wait();
			return result.inputEmail;
		}).future<string>()();
	}

	private sendEmail(email: string): void {
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

			this.$httpClient.httpRequest(options).wait();
		}
 	}
}
$injector.registerCommand("post-install-cli", PostInstallCliCommand);
