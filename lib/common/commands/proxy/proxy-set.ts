import * as commandParams from "../../command-params";
import { isInteractive } from "../../helpers";
import { ProxyCommandBase } from "./proxy-base";
import { HttpProtocolToPort } from "../../constants";
import { parse } from "url";
import { platform, EOL } from "os";
const { getCredentialsFromAuth } = require("proxy-lib/lib/utils");

const proxySetCommandName = "proxy|set";

export class ProxySetCommand extends ProxyCommandBase {
	public allowedParameters = [
		new commandParams.StringCommandParameter(this.$injector),
		new commandParams.StringCommandParameter(this.$injector),
		new commandParams.StringCommandParameter(this.$injector)
	];

	constructor(private $errors: IErrors,
		private $injector: IInjector,
		private $prompter: IPrompter,
		private $hostInfo: IHostInfo,
		private $staticConfig: Config.IStaticConfig,
		protected $analyticsService: IAnalyticsService,
		protected $logger: ILogger,
		protected $options: ICommonOptions,
		protected $proxyService: IProxyService) {
		super($analyticsService, $logger, $proxyService, proxySetCommandName);
	}

	public async execute(args: string[]): Promise<void> {
		let urlString = args[0];
		let username = args[1];
		let password = args[2];

		const noUrl = !urlString;
		if (noUrl) {
			if (!isInteractive()) {
				this.$errors.fail("Console is not interactive - you need to supply all command parameters.");
			} else {
				urlString = await this.$prompter.getString("Url", { allowEmpty: false });
			}
		}

		let urlObj = parse(urlString);
		if ((!urlObj.protocol || !urlObj.hostname) && !isInteractive()) {
			this.$errors.fail("The url you have entered is invalid please enter a valid url containing a valid protocol and hostname.");
		}

		while (!urlObj.protocol || !urlObj.hostname) {
			this.$logger.warn("The url you have entered is invalid please enter a valid url containing a valid protocol and hostname.");
			urlString = await this.$prompter.getString("Url", { allowEmpty: false });
			urlObj = parse(urlString);
		}

		let port = urlObj.port && +urlObj.port || HttpProtocolToPort[urlObj.protocol];
		const noPort = !port || !this.isValidPort(port);
		const authCredentials = getCredentialsFromAuth(urlObj.auth || "");
		if ((username && authCredentials.username && username !== authCredentials.username) ||
			password && authCredentials.password && password !== authCredentials.password) {
			this.$errors.fail("The credentials you have provided in the url address mismatch those passed as command line arguments.");
		}
		username = username || authCredentials.username;
		password = password || authCredentials.password;

		if (!isInteractive()) {
			if (noPort) {
				this.$errors.failWithoutHelp(`The port you have specified (${port || "none"}) is not valid.`);
			} else if (this.isPasswordRequired(username, password)) {
				this.$errors.fail("Console is not interactive - you need to supply all command parameters.");
			}
		}

		if (noPort) {
			if (port) {
				this.$logger.warn(this.getInvalidPortMessage(port));
			}

			port = await this.getPortFromUserInput();
		}

		if (!username) {
			this.$logger.info("In case your proxy requires authentication, please specify username and password. If authentication is not required, just leave it empty.");
			username = await this.$prompter.getString("Username", { defaultAction: () => "" });
		}

		if (this.isPasswordRequired(username, password)) {
			password = await this.$prompter.getPassword("Password");
		}

		const settings: IProxyLibSettings = {
			proxyUrl: urlString,
			username,
			password,
			rejectUnauthorized: !this.$options.insecure
		};

		if (!this.$hostInfo.isWindows) {
			this.$logger.warn(`Note that storing credentials is not supported on ${platform()} yet.`);
		}

		const clientName = this.$staticConfig.CLIENT_NAME.toLowerCase();
		const messageNote = (clientName === "tns" ?
			"Note that 'npm' and 'Gradle' need to be configured separately to work with a proxy." :
			"Note that `npm` needs to be configured separately to work with a proxy.") + EOL;

		this.$logger.warn(`${messageNote}Run '${clientName} proxy set --help' for more information.`);

		await this.$proxyService.setCache(settings);
		this.$logger.out(`Successfully setup proxy.${EOL}`);
		this.$logger.out(await this.$proxyService.getInfo());
		await this.tryTrackUsage();
	}

	private isPasswordRequired(username: string, password: string): boolean {
		return !!(username && !password);
	}

	private isValidPort(port: number): boolean {
		return !isNaN(port) && port > 0 && port < 65536;
	}

	private async getPortFromUserInput(): Promise<number> {
		const schemaName = "port";
		const schema: IPromptSchema = {
			message: "Port",
			type: "input",
			name: schemaName,
			validate: (value: any) => {
				return (!value || !this.isValidPort(value)) ? this.getInvalidPortMessage(value) : true;
			}
		};

		const prompterResult = await this.$prompter.get([schema]);
		return parseInt(prompterResult[schemaName]);
	}

	private getInvalidPortMessage(port: number): string {
		return `Specified port ${port} is not valid. Please enter a value between 1 and 65535.`;
	}
}

$injector.registerCommand(proxySetCommandName, ProxySetCommand);
