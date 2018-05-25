import * as fs from "fs";
import { Extract } from "unzip";

export class FileSystem {
	public exists(path: string): boolean {
		return fs.existsSync(path);
	}

	public extractZip(pathToZip: string, outputDir: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const stream = fs.createReadStream(pathToZip).pipe(Extract({ path: outputDir }));
			stream.on("close", resolve);
			stream.on("error", reject);
		});
	}

	public readDirectory(path: string): string[] {
		return fs.readdirSync(path);
	}

	public readJson<T>(path: string, options?: { encoding?: null; flag?: string; }): T {
		const content = fs.readFileSync(path, options);
		return JSON.parse(content.toString());
	}
}
