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
	allowInvalidVersions?: boolean;
}

// declare const enum ShouldMigrate {
// 	NO,
// 	YES ,
// 	ADVISED
// }

interface IMigrationShouldMigrate {
	shouldMigrate: ShouldMigrate;
	reasons: string[];
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
	shouldUseExactVersion?: boolean;
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
