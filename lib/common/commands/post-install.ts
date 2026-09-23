import { defineCommand } from "../define-command";

export const postInstallCommandDefinition = defineCommand({
	name: "dev-post-install",
	description: "Deprecated; use `ns dev-post-install-cli`.",
	arguments: "none",
	disableAnalytics: true,
	async run(context): Promise<void> {
		context.fail(
			"This command is deprecated. Use `ns dev-post-install-cli` instead",
			{ help: false },
		);
	},
});
