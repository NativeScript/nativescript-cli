import { PackageManagers } from "../../constants";
import { IErrors, IUserSettingsService } from "../declarations";
import { defineCommand } from "../define-command";
import { inject } from "../di";

export interface IPackageManagerSetCommandServices {
	$userSettingsService: IUserSettingsService;
	$errors: IErrors;
	$logger: ILogger;
}

export function setupPackageManagerSetCommand(): IPackageManagerSetCommandServices {
	return {
		$userSettingsService: inject<IUserSettingsService>("userSettingsService"),
		$errors: inject<IErrors>("errors"),
		$logger: inject<ILogger>("logger"),
	};
}

export const packageManagerSetCommandDefinition = defineCommand({
	name: "package-manager|set",
	description: "Sets the package manager the CLI installs dependencies with.",
	arguments: [{ name: "packageManager" }],
	setup: setupPackageManagerSetCommand,
	async run(
		context,
		services: IPackageManagerSetCommandServices,
	): Promise<void> {
		const packageManagerName = context.args[0];
		const supportedPackageManagers = Object.keys(PackageManagers);
		if (supportedPackageManagers.indexOf(packageManagerName) === -1) {
			services.$errors.fail(
				`${packageManagerName} is not a valid package manager. Supported values are: ${supportedPackageManagers.join(
					", ",
				)}.`,
			);
		}

		await services.$userSettingsService.saveSetting(
			"packageManager",
			packageManagerName,
		);

		services.$logger.printMarkdown(
			`Please ensure you have the directory containing \`${packageManagerName}\` executable available in your PATH.`,
		);
		services.$logger.printMarkdown(
			`You've successfully set \`${packageManagerName}\` as your package manager.`,
		);
	},
});
