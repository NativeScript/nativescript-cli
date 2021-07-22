import { IProjectData } from "./project";
import { IProjectDir } from "../common/declarations";
import { ShouldMigrate } from "../constants";

interface IMigrateController {
	shouldMigrate(data: IMigrationData): Promise<boolean>;
	validate(data: IMigrationData): Promise<void>;
	migrate(data: IMigrationData): Promise<void>;
}

interface IMigrationData extends IProjectDir {
	platforms: string[];
	loose?: boolean;
}

interface IMigrationShouldMigrate {
	shouldMigrate: ShouldMigrate;
	reasons: string[];
}

interface IDependency {
	packageName: string;
	isDev?: boolean;
}

interface IDependencyVersion {
	minVersion?: string;
	desiredVersion?: string;
}

interface IMigrationDependency extends IDependency, IDependencyVersion {
	shouldRemove?: boolean;
	replaceWith?: string;
	warning?: string;
	shouldUseExactVersion?: boolean;
	shouldAddIfMissing?: boolean;
	shouldMigrateAction?: (
		dependency: IMigrationDependency,
		projectData: IProjectData,
		loose: boolean
	) => Promise<boolean>;
	migrateAction?: (
		projectData: IProjectData,
		migrationBackupDirPath: string
	) => Promise<IMigrationDependency[]>;
}
