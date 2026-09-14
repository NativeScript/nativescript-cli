import { IProjectData } from "../definitions/project";
import { IMigrateController, IMigrationData } from "../definitions/migrate";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";

export const migrateCommandDefinition = defineCommand({
	name: "migrate",
	description:
		"Migrates the project's dependencies to the ones the current CLI supports.",
	arguments: "none",
	// In setup, not run: it lands ahead of the arguments policy, so being
	// outside a project is what a bad invocation reports first.
	setup(): void {
		inject<IProjectData>("projectData").initializeProjectData();
	},
	async run(): Promise<void> {
		const $devicePlatformsConstants = inject<Mobile.IDevicePlatformsConstants>(
			"devicePlatformsConstants",
		);
		const $migrateController = inject<IMigrateController>("migrateController");
		const $staticConfig = inject<Config.IStaticConfig>("staticConfig");
		const $projectData = inject<IProjectData>("projectData");
		const $logger = inject<ILogger>("logger");
		const migrationData: IMigrationData = {
			projectDir: $projectData.projectDir,
			platforms: [
				$devicePlatformsConstants.Android,
				$devicePlatformsConstants.iOS,
			],
		};
		const shouldMigrateResult =
			await $migrateController.shouldMigrate(migrationData);

		if (!shouldMigrateResult) {
			const cliVersion = $staticConfig.version;
			$logger.printMarkdown(
				`__Project is compatible with NativeScript \`v${cliVersion}\`__`,
			);
			return;
		}

		await $migrateController.migrate(migrationData);
	},
});
