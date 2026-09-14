import { IErrors } from "../declarations";
import { defineCommand } from "../define-command";
import { inject } from "../di";
import { registerCommand } from "../services/command-definition-adapter";

export const postInstallCommandDefinition = defineCommand({
	name: "dev-post-install",
	description: "Deprecated; use `ns dev-post-install-cli`.",
	arguments: "none",
	disableAnalytics: true,
	setup: () => ({
		$errors: inject<IErrors>("errors"),
	}),
	async run(context, services): Promise<void> {
		services.$errors.fail(
			"This command is deprecated. Use `ns dev-post-install-cli` instead",
		);
	},
});

registerCommand(postInstallCommandDefinition);
