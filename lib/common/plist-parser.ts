import * as simplePlist from "simple-plist";

export class PlistParser implements IPlistParser {
	public parseFile(plistFilePath: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			simplePlist.readFile(plistFilePath, (err: Error, obj: any) => {
				if (err) {
					reject(err);
				} else {
					resolve(obj);
				}
			});
		});
	}

	public parseFileSync(plistFilePath: string): any {
		return simplePlist.readFileSync(plistFilePath);
	}
}
$injector.register("plistParser", PlistParser);
