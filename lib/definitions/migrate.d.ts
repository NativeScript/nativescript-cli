import { IProjectData } from "./project";
import { IProjectDir } from "../common/declarations";

interface IMigrateController {
	migrate(data: IMigrationData): Promise<void>;
	shouldMigrate(data: IMigrationData): Promise<boolean>;
	validate(data: IMigrationData): Promise<void>;
}

interface IMigrationData extends IProjectDir {
	platforms: string[];
	allowInvalidVersions?: boolean;
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
	shouldMigrateAction?: (
		projectData: IProjectData,
		allowInvalidVersions: boolean
	) => Promise<boolean>;
	migrateAction?: (
		projectData: IProjectData,
		migrationBackupDirPath: string
	) => Promise<IMigrationDependency[]>;
}
