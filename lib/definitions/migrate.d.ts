interface IMigrateController {
	migrate(migrateData: IProjectDir): Promise<void>;
	shouldMigrate(data: IProjectDir): Promise<boolean>;
}

interface IDependency {
	packageName: string;
	isDev?: boolean;
}

interface IMigrationDependency extends IDependency {
	mustRemove?: boolean;
	replaceWith?: string;
	verifiedVersion?: string;
	shouldAdd?: boolean;
}