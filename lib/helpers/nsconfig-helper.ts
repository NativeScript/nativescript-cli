import { CONFIG_NS_FILE_NAME } from "../constants";
import { existsSync, readFileSync } from "fs";
import { sep } from "path";

export default class NsConfigHelper  {
	public static mergedOptions(initialArgv: any, argv: any): any {
		const underdash: Array<string> = initialArgv._ || argv._ || [];
		const projectDir = this._getProjectDir(argv.path);
		const platformName = this._getPlatformName(underdash);
		const platformOptions = this._getPlatformOptions(projectDir, platformName);
		const formattedPlatformOptions = this._getFormattedPlatformOptions(platformOptions);

		return { ...argv, ...formattedPlatformOptions, ...initialArgv };
	}

	private static _getFormattedPlatformOptions(platformOptions: any): any {
		const formattedPlatformOptions: any = {};

		for (const optionName in platformOptions) {
			const optionNameVariant: string = this._getOptionNameVariant(optionName);
			const optionValue: any = platformOptions[optionName];

			if (typeof optionValue === "object" && optionValue !== null) {
				this._getFormattedPlatformOptions(optionValue);
			}

			if (optionNameVariant) {
				formattedPlatformOptions[optionNameVariant] = optionValue;
			}

			formattedPlatformOptions[optionName] = optionValue;
		}

		return formattedPlatformOptions;
	}

	private static _getOptionNameVariant(optionName: string): string {
		let optionNameVariant: string = "";

		if (this._isOptionNameDashed(optionName)) {
			optionNameVariant = this._dashedToCapitalized(optionName);
		} else if (this._isOptionNameCapitalized(optionName)) {
			optionNameVariant = this._capitalizedToDashed(optionName);
		}

		return optionNameVariant;
	}

	private static _isOptionNameCapitalized(optionName: string): boolean {
		const regex: RegExp = /[A-Z]/g;

		return regex.test(optionName);
	}

	private static _isOptionNameDashed(optionName: string): boolean {
		return optionName.indexOf("-") !== -1;
	}

	private static _capitalizedToDashed(optionName: string): string {
		const regex: RegExp = /[A-Z]/g;
		const dashedOptionName = optionName.replace(regex, "-$&");

		return dashedOptionName.toLowerCase() || "";
	}

	private static _dashedToCapitalized(optionName: string): string {
		const words = optionName.split("-") || [];
		const capitalizedWords = words.map((word, index) => {
			if (index === 0) {
				return word;
			}

			return word.charAt(0).toUpperCase() + word.slice(1);
		});

		return capitalizedWords.join("") || "";
	}

	private static _getPlatformName(underdash: Array<string>): string {
		const regex: RegExp = /^(android|ios)$/i;
		const platformName: string = underdash.find(element => regex.test(element));

		return platformName.toLowerCase() || "";
	}

	private static _getProjectDir(path?: string): string {
		return path || process.cwd() || "";
	}

	private static _getPlatformOptions(projectDir: string, platformName: string): any {
		const nsConfigData = this._getNsConfigData(projectDir);
		const tnsOptionsData: any = nsConfigData.tnsOptions || {};

		return tnsOptionsData[platformName] || {};
	}

	private static _getNsConfigData(projectDir: string): INsConfig {
		const nsConfigPath: string = `${projectDir}${sep}${CONFIG_NS_FILE_NAME}`;
		const nsConfigData: INsConfig = existsSync(nsConfigPath) ? JSON.parse(readFileSync(nsConfigPath, "utf8")) : {};

		return nsConfigData;
	}
}
