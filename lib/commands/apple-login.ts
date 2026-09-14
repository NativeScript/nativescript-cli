import { IErrors } from "../common/declarations";
import { CommandContext, defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { registerCommand } from "../common/services/command-definition-adapter";
import { IApplePortalSessionService } from "../services/apple-portal/definitions";

export type AppleLoginCommandContext = CommandContext;

export interface IAppleLoginCommandServices {
	$applePortalSessionService: IApplePortalSessionService;
	$errors: IErrors;
	$logger: ILogger;
	$prompter: IPrompter;
}

export function setupAppleLoginCommand(): IAppleLoginCommandServices {
	return {
		$applePortalSessionService: inject<IApplePortalSessionService>(
			"applePortalSessionService",
		),
		$errors: inject<IErrors>("errors"),
		$logger: inject<ILogger>("logger"),
		$prompter: inject<IPrompter>("prompter"),
	};
}

export async function runAppleLoginCommand(
	context: AppleLoginCommandContext,
	services: IAppleLoginCommandServices,
): Promise<void> {
	let username = context.args[0];
	if (!username) {
		username = await services.$prompter.getString("Apple ID", {
			allowEmpty: false,
		});
	}

	let password = context.args[1];
	if (!password) {
		password = await services.$prompter.getPassword("Apple ID password");
	}

	const user = await services.$applePortalSessionService.createUserSession({
		username,
		password,
	});
	if (!user.areCredentialsValid) {
		services.$errors.fail(
			`Invalid username and password combination. Used '${username}' as the username.`,
		);
	}

	const output = Buffer.from(user.userSessionCookie).toString("base64");
	services.$logger.info(output);
}

export const appleLoginCommandDefinition = defineCommand({
	name: "apple-login",
	description: "Logs in to an Apple account and prints the session cookie.",
	arguments: [{ name: "appleId" }, { name: "password" }],
	setup: setupAppleLoginCommand,
	run: runAppleLoginCommand,
});

registerCommand(appleLoginCommandDefinition);
