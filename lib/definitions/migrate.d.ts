interface IMigrateController {
	migrate(migrateData: IProjectDir): Promise<void>;
	shouldMigrate(data: IProjectDir): Promise<boolean>;
}