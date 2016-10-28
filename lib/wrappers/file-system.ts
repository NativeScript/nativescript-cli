import * as fs from "fs";
import { Extract } from "unzip";

export class FileSystem {
	public exists(path: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			fs.exists(path, resolve);
		});
	}

	public extractZip(pathToZip: string, outputDir: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const stream = fs.createReadStream(pathToZip).pipe(Extract({ path: outputDir }));
			stream.on("close", resolve);
			stream.on("error", reject);
		});
	}
}
