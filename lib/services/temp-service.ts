import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";
import { ICleanupService } from "../definitions/cleanup-service";
import { injector } from "../common/yok";
import { ITempService } from "../definitions/temp-service";

type TempAffixOptions = {
	prefix?: string;
	suffix?: string;
	dir?: string;
};

export class TempService implements ITempService {
	constructor(private $cleanupService: ICleanupService) {
		// no-op
	}

	public async mkdirSync(affixes: string | TempAffixOptions): Promise<string> {
		const opts = typeof affixes === "string" ? { prefix: affixes } : affixes;
		const baseDir = opts?.dir ? opts.dir : tmpdir();
		const prefix = (opts?.prefix ?? "ns-").replace(/\s+/g, "-");
		// fs.mkdtempSync requires the full path prefix
		const pathToDir = fs.mkdtempSync(path.join(baseDir, prefix));
		await this.$cleanupService.addCleanupDeleteAction(pathToDir);
		return pathToDir;
	}

	public async path(options: string | TempAffixOptions): Promise<string> {
		const opts = typeof options === "string" ? { prefix: options } : options;
		const baseDir = opts?.dir ? opts.dir : tmpdir();
		const prefix = (opts?.prefix ?? "ns-").replace(/\s+/g, "-");
		const suffix = opts?.suffix ?? "";
		const unique = Math.random().toString(36).slice(2);
		const filePath = path.join(baseDir, `${prefix}${unique}${suffix}`);
		const pathToFile = filePath;
		await this.$cleanupService.addCleanupDeleteAction(pathToFile);
		return pathToFile;
	}
}

injector.register("tempService", TempService);
