import { AndroidVirtualDevice } from '../../constants';
import * as iconv from "iconv-lite";

export class AndroidIniFileParser implements Mobile.IAndroidIniFileParser {
	constructor(private $fs: IFileSystem) {
		iconv.extendNodeEncodings();
	}

	public parseIniFile(iniFilePath: string): Mobile.IAvdInfo {
		if (!this.$fs.exists(iniFilePath)) {
			return null;
		}

		// avd files can have different encoding, defined on the first line.
		// find which one it is (if any) and use it to correctly read the file contents
		const encoding = this.getAvdEncoding(iniFilePath);
		const contents = this.$fs.readText(iniFilePath, encoding).split("\n");

		return _.reduce(contents, (result: Mobile.IAvdInfo, line: string) => {
			const parsedLine = line.split("=");
			const key = parsedLine[0];
			switch (key) {
				case "target":
					result.target = parsedLine[1];
					result.targetNum = this.readTargetNum(result.target);
					break;
				case "path":
				case "AvdId":
					result[_.lowerFirst(key)] = parsedLine[1];
					break;
				case "hw.device.name":
					result.device = parsedLine[1];
					break;
				case "avd.ini.displayname":
					result.displayName = parsedLine[1];
					break;
				case "abi.type":
				case "skin.name":
				case "sdcard.size":
					result[key.split(".")[0]] = parsedLine[1];
					break;
			}
			return result;
		}, <Mobile.IAvdInfo>Object.create(null));
	}

	private getAvdEncoding(avdName: string): any {
		// avd files can have different encoding, defined on the first line.
		// find which one it is (if any) and use it to correctly read the file contents
		let encoding = "utf8";
		let contents = this.$fs.readText(avdName, "ascii");
		if (contents.length > 0) {
			contents = contents.split("\n", 1)[0];
			if (contents.length > 0) {
				const matches = contents.match(AndroidVirtualDevice.ENCODING_MASK);
				if (matches) {
					encoding = matches[1];
				}
			}
		}
		return encoding;
	}

	// Android L is not written as a number in the .ini files, and we need to convert it
	private readTargetNum(target: string): number {
		const platform = target.replace('android-', '');
		let platformNumber = +platform;
		if (isNaN(platformNumber)) {
			// this may be a google image
			const googlePlatform = target.split(":")[2];
			if (googlePlatform) {
				platformNumber = +googlePlatform;
			} else if (platform === "L") { // Android SDK 20 preview
				platformNumber = 20;
			} else if (platform === "MNC") { // Android M preview
				platformNumber = 22;
			}
		}
		return platformNumber;
	}
}
$injector.register("androidIniFileParser", AndroidIniFileParser);
