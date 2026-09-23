import { Contract } from "../common/di/contract";
import type { AffixOptions } from "../definitions/temp-service";

/**
 * Creates temporary files and directories that are cleaned up on exit.
 */
@Contract({ name: "tempService" })
export abstract class TempService {
	abstract mkdirSync(affixes: string | AffixOptions): Promise<string>;

	abstract path(options: string | AffixOptions): Promise<string>;
}
