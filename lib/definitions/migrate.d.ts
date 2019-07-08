interface IMigrateController {
	migrate(migrateData: IProjectDir): Promise<void>;
	shouldMigrate(data: IProjectDir): Promise<boolean>;
}

interface IDependency {
	packageName: string;
	isDev?: boolean;
}

interface IMigrationDependency extends IDependency {
	shouldRemove?: boolean;
	replaceWith?: string;
	warning?: string;
	verifiedVersion?: string;
	shouldAddIfMissing?: boolean;
	shouldMigrateAction?: (projectData: IProjectData) => boolean;
	migrateAction?: (projectData: IProjectData, migrationBackupDirPath: string) => Promise<IMigrationDependency[]>;
}