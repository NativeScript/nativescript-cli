import { IUserSettingsService } from "../declarations";
import { defineCommand } from "../define-command";
import { inject } from "../di";

export function setupPackageManagerGetCommand() {
	return {
		$logger: inject<ILogger>("logger"),
		$userSettingsService: inject<IUserSettingsService>("userSettingsService"),
	};
}

export type IPackageManagerGetCommandServices = ReturnType<
	typeof setupPackageManagerGetCommand
>;

export const packageManagerGetCommandDefinition = defineCommand({
	name: "package-manager|*get",
	description: "Prints the value of the current package manager.",
	setup: setupPackageManagerGetCommand,
	async run(
		context,
		services: IPackageManagerGetCommandServices,
	): Promise<void> {
		const result =
			await services.$userSettingsService.getSettingValue("packageManager");
		services.$logger.printMarkdown(
			`Your current package manager is \`${result || "npm"}\`.`,
		);
	},
});
