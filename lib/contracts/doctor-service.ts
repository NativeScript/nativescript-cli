import { Contract } from "../common/di/contract";
import type { ISpawnResult } from "../common/declarations";
import type { IOptions } from "../declarations";

/**
 * Verifies the host OS configuration — the code behind `ns doctor`.
 */
@Contract({ name: "doctorService" })
export abstract class DoctorService {
	/**
	 * Verifies the host OS configuration and prints warnings to the users.
	 * @param configOptions Defines if the result should be tracked by Analytics.
	 */
	abstract printWarnings(configOptions?: {
		trackResult?: boolean;
		projectDir?: string;
		runtimeVersion?: string;
		options?: IOptions;
		forceCheck?: boolean;
		platform?: string;
	}): Promise<void>;

	/** Runs the setup script on the host machine. */
	abstract runSetupScript(): Promise<ISpawnResult>;

	/**
	 * Checks whether the environment is properly configured for local builds.
	 */
	abstract canExecuteLocalBuild(configuration?: {
		platform?: string;
		projectDir?: string;
		runtimeVersion?: string;
		forceCheck?: boolean;
	}): Promise<boolean>;

	/** Checks and notifies users of deprecated short imports in their app. */
	abstract checkForDeprecatedShortImportsInAppDir(projectDir: string): void;
}
