interface IMigrateController {
	migrate(data: IMigrationData): Promise<void>;
	shouldMigrate(data: IMigrationData): Promise<boolean>;
	validate(data: IMigrationData): Promise<void>;
}

interface IMigrationData extends IProjectDir {
	platforms: string[];
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
	getVerifiedVersion?: (projectData: IProjectData) => Promise<string>;
	shouldAddIfMissing?: boolean;
	shouldMigrateAction?: (projectData: IProjectData) => Promise<boolean>;
	migrateAction?: (projectData: IProjectData, migrationBackupDirPath: string) => Promise<IMigrationDependency[]>;
}