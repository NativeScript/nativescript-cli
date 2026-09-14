import { IProjectData } from "../definitions/project";
import { IMigrateController, IMigrationData } from "../definitions/migrate";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";

export interface IMigrateCommandServices {
	$devicePlatformsConstants: Mobile.IDevicePlatformsConstants;
	$migrateController: IMigrateController;
	$staticConfig: Config.IStaticConfig;
	$projectData: IProjectData;
	$logger: ILogger;
}

export function setupMigrateCommand(): IMigrateCommandServices {
	const services = {
		$devicePlatformsConstants: inject<Mobile.IDevicePlatformsConstants>(
			"devicePlatformsConstants",
		),
		$migrateController: inject<IMigrateController>("migrateController"),
		$staticConfig: inject<Config.IStaticConfig>("staticConfig"),
		$projectData: inject<IProjectData>("projectData"),
		$logger: inject<ILogger>("logger"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export const migrateCommandDefinition = defineCommand({
	name: "migrate",
	description:
		"Migrates the project's dependencies to the ones the current CLI supports.",
	arguments: "none",
	setup: setupMigrateCommand,
	async run(context, services): Promise<void> {
		const migrationData: IMigrationData = {
			projectDir: services.$projectData.projectDir,
			platforms: [
				services.$devicePlatformsConstants.Android,
				services.$devicePlatformsConstants.iOS,
			],
		};
		const shouldMigrateResult =
			await services.$migrateController.shouldMigrate(migrationData);

		if (!shouldMigrateResult) {
			const cliVersion = services.$staticConfig.version;
			services.$logger.printMarkdown(
				`__Project is compatible with NativeScript \`v${cliVersion}\`__`,
			);
			return;
		}

		await services.$migrateController.migrate(migrationData);
	},
});
