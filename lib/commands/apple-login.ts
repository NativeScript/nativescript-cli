import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { IApplePortalSessionService } from "../services/apple-portal/definitions";

export const appleLoginCommandDefinition = defineCommand({
	name: "apple-login",
	description: "Logs in to an Apple account and prints the session cookie.",
	params: [{ name: "appleId" }, { name: "password" }],
	async run(context) {
		const $applePortalSessionService = inject<IApplePortalSessionService>(
			"applePortalSessionService",
		);
		const $logger = inject<ILogger>("logger");
		const $prompter = inject<IPrompter>("prompter");

		let username = context.args[0];
		if (!username) {
			username = await $prompter.getString("Apple ID", {
				allowEmpty: false,
			});
		}

		let password = context.args[1];
		if (!password) {
			password = await $prompter.getPassword("Apple ID password");
		}

		const user = await $applePortalSessionService.createUserSession({
			username,
			password,
		});
		if (!user.areCredentialsValid) {
			context.fail(
				`Invalid username and password combination. Used '${username}' as the username.`,
				{ help: false },
			);
		}

		const output = Buffer.from(user.userSessionCookie).toString("base64");
		$logger.info(output);
	},
});
