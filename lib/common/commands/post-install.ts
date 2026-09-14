import { IErrors } from "../declarations";
import { defineCommand } from "../define-command";
import { inject } from "../di";

export const postInstallCommandDefinition = defineCommand({
	name: "dev-post-install",
	description: "Deprecated; use `ns dev-post-install-cli`.",
	arguments: "none",
	disableAnalytics: true,
	async run(): Promise<void> {
		const $errors = inject<IErrors>("errors");

		$errors.fail(
			"This command is deprecated. Use `ns dev-post-install-cli` instead",
		);
	},
});
