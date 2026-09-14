import { EOL, platform } from "os";
import { parse } from "url";
import { HttpProtocolToPort } from "../../constants";
import {
	IErrors,
	IHostInfo,
	IProxyLibSettings,
	IPrompterQuestion,
} from "../../declarations";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
} from "../../define-command";
import { inject } from "../../di";
import { isInteractive } from "../../helpers";
import { registerCommand } from "../../services/command-definition-adapter";
import {
	injectProxyCommandServices,
	IProxyCommandServices,
	tryTrackProxyCommandUsage,
} from "./proxy-base";
const { getCredentialsFromAuth } = require("proxy-lib/lib/utils");

const proxySetCommandName = "proxy|set";

const proxySetCommandOptions = {
	insecure: booleanOption(),
} satisfies CommandOptionsSchema;

export type ProxySetCommandContext = CommandContext<
	typeof proxySetCommandOptions
>;

export interface IProxySetCommandServices extends IProxyCommandServices {
	$errors: IErrors;
	$hostInfo: IHostInfo;
	$prompter: IPrompter;
	$staticConfig: Config.IStaticConfig;
}

export function setupProxySetCommand(): IProxySetCommandServices {
	return {
		...injectProxyCommandServices(),
		$errors: inject<IErrors>("errors"),
		$hostInfo: inject<IHostInfo>("hostInfo"),
		$prompter: inject<IPrompter>("prompter"),
		$staticConfig: inject<Config.IStaticConfig>("staticConfig"),
	};
}

function isPasswordRequired(username: string, password: string): boolean {
	return !!(username && !password);
}

function isValidPort(port: number): boolean {
	return !isNaN(port) && port > 0 && port < 65536;
}

function getInvalidPortMessage(port: number): string {
	return `Specified port ${port} is not valid. Please enter a value between 1 and 65535.`;
}

async function getPortFromUserInput(
	services: IProxySetCommandServices,
): Promise<number> {
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

	const prompterResult = await services.$prompter.get([schema]);
	return parseInt(prompterResult[schemaName]);
}

export async function runProxySetCommand(
	context: ProxySetCommandContext,
	services: IProxySetCommandServices,
): Promise<void> {
	let urlString = context.args[0];
	let username = context.args[1];
	let password = context.args[2];

	const noUrl = !urlString;
	if (noUrl) {
		if (!isInteractive()) {
			services.$errors.failWithHelp(
				"Console is not interactive - you need to supply all command parameters.",
			);
		} else {
			urlString = await services.$prompter.getString("Url", {
				allowEmpty: false,
			});
		}
	}

	let urlObj = parse(urlString);
	if ((!urlObj.protocol || !urlObj.hostname) && !isInteractive()) {
		services.$errors.fail(
			"The url you have entered is invalid please enter a valid url containing a valid protocol and hostname.",
		);
	}

	while (!urlObj.protocol || !urlObj.hostname) {
		services.$logger.warn(
			"The url you have entered is invalid please enter a valid url containing a valid protocol and hostname.",
		);
		urlString = await services.$prompter.getString("Url", {
			allowEmpty: false,
		});
		urlObj = parse(urlString);
	}

	let port =
		(urlObj.port && +urlObj.port) || HttpProtocolToPort[urlObj.protocol];
	const noPort = !port || !isValidPort(port);
	const authCredentials = getCredentialsFromAuth(urlObj.auth || "");
	if (
		(username &&
			authCredentials.username &&
			username !== authCredentials.username) ||
		(password &&
			authCredentials.password &&
			password !== authCredentials.password)
	) {
		services.$errors.fail(
			"The credentials you have provided in the url address mismatch those passed as command line arguments.",
		);
	}
	username = username || authCredentials.username;
	password = password || authCredentials.password;

	if (!isInteractive()) {
		if (noPort) {
			services.$errors.fail(
				`The port you have specified (${port || "none"}) is not valid.`,
			);
		} else if (isPasswordRequired(username, password)) {
			services.$errors.failWithHelp(
				"Console is not interactive - you need to supply all command parameters.",
			);
		}
	}

	if (noPort) {
		if (port) {
			services.$logger.warn(getInvalidPortMessage(port));
		}

		port = await getPortFromUserInput(services);
	}

	if (!username) {
		services.$logger.info(
			"In case your proxy requires authentication, please specify username and password. If authentication is not required, just leave it empty.",
		);
		username = await services.$prompter.getString("Username", {
			defaultAction: () => "",
		});
	}

	if (isPasswordRequired(username, password)) {
		password = await services.$prompter.getPassword("Password");
	}

	const settings: IProxyLibSettings = {
		proxyUrl: urlString,
		username,
		password,
		rejectUnauthorized: !context.options.insecure,
	};

	if (!services.$hostInfo.isWindows) {
		services.$logger.warn(
			`Note that storing credentials is not supported on ${platform()} yet.`,
		);
	}

	const clientName = services.$staticConfig.CLIENT_NAME.toLowerCase();
	const messageNote =
		(clientName === "tns"
			? "Note that 'npm' and 'Gradle' need to be configured separately to work with a proxy."
			: "Note that `npm` needs to be configured separately to work with a proxy.") +
		EOL;

	services.$logger.warn(
		`${messageNote}Run '${clientName} proxy set --help' for more information.`,
	);

	await services.$proxyService.setCache(settings);
	services.$logger.info(`Successfully setup proxy.${EOL}`);
	services.$logger.info(await services.$proxyService.getInfo());
	await tryTrackProxyCommandUsage(services, proxySetCommandName);
}

export const proxySetCommandDefinition = defineCommand({
	name: proxySetCommandName,
	description: "Configures a proxy for the CLI to use.",
	options: proxySetCommandOptions,
	arguments: [{ name: "url" }, { name: "username" }, { name: "password" }],
	disableAnalytics: true,
	setup: setupProxySetCommand,
	run: runProxySetCommand,
});

registerCommand(proxySetCommandDefinition);
