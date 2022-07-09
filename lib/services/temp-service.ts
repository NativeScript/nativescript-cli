import * as temp from "temp";
import { ICleanupService } from "../definitions/cleanup-service";
import { injector } from "../common/yok";
import { AffixOptions } from "temp";
import { ITempService } from "../definitions/temp-service";

export class TempService implements ITempService {
	constructor(private $cleanupService: ICleanupService) {
		temp.track();
	}

	public async mkdirSync(affixes: string | AffixOptions): Promise<string> {
		const pathToDir = temp.mkdirSync(affixes);
		await this.$cleanupService.addCleanupDeleteAction(pathToDir);
		return pathToDir;
	}

	public async path(options: string | AffixOptions): Promise<string> {
		const pathToFile = temp.path(options);
		await this.$cleanupService.addCleanupDeleteAction(pathToFile);
		return pathToFile;
	}
}

injector.register("tempService", TempService);
