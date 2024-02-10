import { readFileSync, readFile } from "simple-plist";
import { IPlistParser } from "./declarations";
import { injector } from "./yok";

export class PlistParser implements IPlistParser {
	public parseFile(plistFilePath: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			readFile(plistFilePath, (err: Error, obj: any) => {
				if (err) {
					reject(err);
				} else {
					resolve(obj);
				}
			});
		});
	}

	public parseFileSync(plistFilePath: string): any {
		return readFileSync(plistFilePath);
	}
}
injector.register("plistParser", PlistParser);
