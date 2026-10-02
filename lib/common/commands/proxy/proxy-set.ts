import { EOL, platform } from "os";
import { parse, UrlWithStringQuery } from "url";
import { HttpProtocolToPort } from "../../constants";
import {
	IHostInfo,
	IProxyLibSettings,
	IProxyService,
	IPrompterQuestion,
} from "../../declarations";
import {
	booleanOption,
	Command,
	CommandOptionsSchema,
} from "../../define-command";
import { inject } from "../../di";
import { isInteractive } from "../../helpers";
import { tryTrackProxyCommandUsage } from "./proxy-base";
const { getCredentialsFromAuth } = require("proxy-lib/lib/utils");

const proxySetCommandName = "proxy|set";

const proxySetCommandOptions = {
	insecure: booleanOption(),
} satisfies CommandOptionsSchema;

function isPasswordRequired(username: string, password: string): boolean {
	return !!(username && !password);
}

function isValidPort(port: number): boolean {
	return !isNaN(port) && port > 0 && port < 65536;
}

function getInvalidPortMessage(port: number): string {
	return `Specified port ${port} is not valid. Please enter a value between 1 and 65535.`;
}

export class ProxySetCommand extends Command({
	name: proxySetCommandName,
	description: "Configures a proxy for the CLI to use.",
	options: proxySetCommandOptions,
	params: [{ name: "url" }, { name: "username" }, { name: "password" }],
	disableAnalytics: true,
}) {
	private $logger = inject<ILogger>("logger");
	private $proxyService = inject<IProxyService>("proxyService");
	private $hostInfo = inject<IHostInfo>("hostInfo");
	private $prompter = inject<IPrompter>("prompter");
	private $staticConfig = inject<Config.IStaticConfig>("staticConfig");

	public async run(): Promise<void> {
		let username = this.args[1];
		let password = this.args[2];

		const { urlString, urlObj } = await this.resolveUrl(this.args[0]);

		let port =
			(urlObj.port && +urlObj.port) || HttpProtocolToPort[urlObj.protocol];
		const noPort = !port || !isValidPort(port);

		const credentials = this.resolveCredentials(
			urlObj.auth || "",
			username,
			password,
		);
		username = credentials.username;
		password = credentials.password;

		if (!isInteractive()) {
			if (noPort) {
				this.context.fail(
					`The port you have specified (${port || "none"}) is not valid.`,
					{ help: false },
				);
			} else if (isPasswordRequired(username, password)) {
				this.context.fail(
					"Console is not interactive - you need to supply all command parameters.",
				);
			}
		}

		if (noPort) {
			if (port) {
				this.$logger.warn(getInvalidPortMessage(port));
			}

			port = await this.getPortFromUserInput();
		}

		if (!username) {
			this.$logger.info(
				"In case your proxy requires authentication, please specify username and password. If authentication is not required, just leave it empty.",
			);
			username = await this.$prompter.getString("Username", {
				defaultAction: () => "",
			});
		}

		if (isPasswordRequired(username, password)) {
			password = await this.$prompter.getPassword("Password");
		}

		await this.saveSettings({
			proxyUrl: urlString,
			username,
			password,
			rejectUnauthorized: !this.options.insecure,
		});
	}

	private async resolveUrl(
		urlString: string,
	): Promise<{ urlString: string; urlObj: UrlWithStringQuery }> {
		const noUrl = !urlString;
		if (noUrl) {
			if (!isInteractive()) {
				this.context.fail(
					"Console is not interactive - you need to supply all command parameters.",
				);
			} else {
				urlString = await this.$prompter.getString("Url", {
					allowEmpty: false,
				});
			}
		}

		let urlObj = parse(urlString);
		if ((!urlObj.protocol || !urlObj.hostname) && !isInteractive()) {
			this.context.fail(
				"The url you have entered is invalid please enter a valid url containing a valid protocol and hostname.",
				{ help: false },
			);
		}

		while (!urlObj.protocol || !urlObj.hostname) {
			this.$logger.warn(
				"The url you have entered is invalid please enter a valid url containing a valid protocol and hostname.",
			);
			urlString = await this.$prompter.getString("Url", {
				allowEmpty: false,
			});
			urlObj = parse(urlString);
		}

		return { urlString, urlObj };
	}

	private resolveCredentials(
		auth: string,
		username: string,
		password: string,
	): { username: string; password: string } {
		const authCredentials = getCredentialsFromAuth(auth);
		if (
			(username &&
				authCredentials.username &&
				username !== authCredentials.username) ||
			(password &&
				authCredentials.password &&
				password !== authCredentials.password)
		) {
			this.context.fail(
				"The credentials you have provided in the url address mismatch those passed as command line arguments.",
				{ help: false },
			);
		}

		return {
			username: username || authCredentials.username,
			password: password || authCredentials.password,
		};
	}

	private async getPortFromUserInput(): Promise<number> {
		const schemaName = "port";
		const schema: IPrompterQuestion = {
			message: "Port",
			type: "text",
			name: schemaName,
			validate: (value: any) => {
				return !value || !isValidPort(value)
					? getInvalidPortMessage(value)
					: true;
			},
		};

		const prompterResult = await this.$prompter.get([schema]);
		return parseInt(prompterResult[schemaName]);
	}

	private async saveSettings(settings: IProxyLibSettings): Promise<void> {
		if (!this.$hostInfo.isWindows) {
			this.$logger.warn(
				`Note that storing credentials is not supported on ${platform()} yet.`,
			);
		}

		const clientName = this.$staticConfig.CLIENT_NAME.toLowerCase();
		const messageNote =
			(clientName === "tns"
				? "Note that 'npm' and 'Gradle' need to be configured separately to work with a proxy."
				: "Note that `npm` needs to be configured separately to work with a proxy.") +
			EOL;

		this.$logger.warn(
			`${messageNote}Run '${clientName} proxy set --help' for more information.`,
		);

		await this.$proxyService.setCache(settings);
		this.$logger.info(`Successfully setup proxy.${EOL}`);
		this.$logger.info(await this.$proxyService.getInfo());
		await tryTrackProxyCommandUsage(this.$logger, proxySetCommandName);
	}
}
