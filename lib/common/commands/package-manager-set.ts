import { PackageManagers } from "../../constants";
import { IErrors, IUserSettingsService } from "../declarations";
import { defineCommand } from "../define-command";
import { inject } from "../di";

export const packageManagerSetCommandDefinition = defineCommand({
	name: "package-manager|set",
	description: "Sets the package manager the CLI installs dependencies with.",
	arguments: [{ name: "packageManager" }],
	async run(context): Promise<void> {
		const $userSettingsService = inject<IUserSettingsService>(
			"userSettingsService",
		);
		const $errors = inject<IErrors>("errors");
		const $logger = inject<ILogger>("logger");

		const packageManagerName = context.args[0];
		const supportedPackageManagers = Object.keys(PackageManagers);
		if (supportedPackageManagers.indexOf(packageManagerName) === -1) {
			$errors.fail(
				`${packageManagerName} is not a valid package manager. Supported values are: ${supportedPackageManagers.join(
					", ",
				)}.`,
			);
		}

		await $userSettingsService.saveSetting(
			"packageManager",
			packageManagerName,
		);

		$logger.printMarkdown(
			`Please ensure you have the directory containing \`${packageManagerName}\` executable available in your PATH.`,
		);
		$logger.printMarkdown(
			`You've successfully set \`${packageManagerName}\` as your package manager.`,
		);
	},
});
