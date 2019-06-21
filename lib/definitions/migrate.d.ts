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
	verifiedVersion?: string;
	shouldAddIfMissing?: boolean;
}