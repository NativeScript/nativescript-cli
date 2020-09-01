import {
	CONFIG_FILE_NAME_DISPLAY,
	CONFIG_FILE_NAME_JS,
	CONFIG_FILE_NAME_TS,
	CONFIG_NS_FILE_NAME,
} from "../constants";
import * as path from "path";
import * as _ from "lodash";
import * as ts from "typescript";
import { IFileSystem, IProjectHelper } from "../common/declarations";
import { INsConfig, IProjectConfigService } from "../definitions/project";
import { IInjector } from "../common/definitions/yok";
import {
	ConfigTransformer,
	IConfigTransformer,
	SupportedConfigValues,
} from "../tools/config-manipulation/config-transformer";
import { IBasePluginData } from "../definitions/plugins";
import { injector } from "../common/yok";
import { EOL } from "os";
import { IOptions } from "../declarations";
import {
	format as prettierFormat,
	resolveConfig as resolvePrettierConfig,
} from "prettier";
import semver = require("semver/preload");

export class ProjectConfigService implements IProjectConfigService {
	private _hasWarnedLegacy = false;
	private _handledLegacyId = false;

	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $options: IOptions,
		private $injector: IInjector
	) {}

	private requireFromString(src: string, filename: string): NodeModule {
		// @ts-ignore
		const m = new module.constructor();
		m.paths = module.paths;
		m._compile(src, filename);
		return m.exports;
	}

	get projectHelper(): IProjectHelper {
		return this.$injector.resolve("projectHelper");
	}

	public getDefaultTSConfig(appId: string = "org.nativescript.app") {
		return `import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: '${appId}',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  }
} as NativeScriptConfig;`.trim();
	}

	public detectInfo(
		projectDir?: string
	): {
		hasTS: boolean;
		hasJS: boolean;
		usesLegacyConfig: boolean;
		configJSFilePath: string;
		configTSFilePath: string;
		configNSConfigFilePath: string;
	} {
		const configJSFilePath = path.join(
			projectDir || this.projectHelper.projectDir,
			CONFIG_FILE_NAME_JS
		);
		const configTSFilePath = path.join(
			projectDir || this.projectHelper.projectDir,
			CONFIG_FILE_NAME_TS
		);
		const configNSConfigFilePath = path.join(
			projectDir || this.projectHelper.projectDir,
			CONFIG_NS_FILE_NAME
		);
		const hasTS = this.$fs.exists(configTSFilePath);
		const hasJS = this.$fs.exists(configJSFilePath);
		let usesLegacyConfig = false;

		if (this.$fs.exists(configNSConfigFilePath) && !hasTS && !hasJS) {
			usesLegacyConfig = true;
			if (!this._hasWarnedLegacy) {
				this._hasWarnedLegacy = true;
				this.$logger.debug(
					"the value of this.$options.argv._[0] is: " + this.$options.argv._[0]
				);
				const isMigrate = _.get(this.$options, "argv._[0]") === "migrate";
				if (!isMigrate) {
					this.$logger.warn(
						`You are using the deprecated ${CONFIG_NS_FILE_NAME} file. Just be aware that NativeScript 7 has an improved ${CONFIG_FILE_NAME_DISPLAY} file for when you're ready to upgrade this project.`
					);
				}
			}
			// throw new Error(
			// 	`You do not appear to have a ${CONFIG_FILE_NAME_DISPLAY} file. Please install NativeScript 7+ "npm i -g nativescript". You can also try running "ns migrate" after you have the latest installed. Exiting for now.`
			// );
		}

		if (hasTS && hasJS) {
			this.$logger.warn(
				`You have both a ${CONFIG_FILE_NAME_JS} and ${CONFIG_FILE_NAME_TS} file. Defaulting to ${CONFIG_FILE_NAME_TS}.`
			);
		}

		return {
			hasTS,
			hasJS,
			usesLegacyConfig,
			configJSFilePath,
			configTSFilePath,
			configNSConfigFilePath,
		};
	}

	public readConfig(projectDir?: string): INsConfig {
		const {
			hasTS,
			hasJS,
			configJSFilePath,
			configTSFilePath,
			usesLegacyConfig,
			configNSConfigFilePath,
		} = this.detectInfo(projectDir);

		let config: INsConfig;

		if (usesLegacyConfig) {
			this.$logger.trace(
				"Project Config Service: Using legacy nsconfig.json..."
			);
			return this._readAndUpdateLegacyConfig(configNSConfigFilePath);
		}

		if (hasTS) {
			const rawSource = this.$fs.readText(configTSFilePath);
			const transpiledSource = ts.transpileModule(rawSource, {
				compilerOptions: { module: ts.ModuleKind.CommonJS },
			});
			const result: any = this.requireFromString(
				transpiledSource.outputText,
				configTSFilePath
			);
			config = result["default"] ? result["default"] : result;
			// console.log('transpiledSource.outputText:', transpiledSource.outputText)
			// config = eval(transpiledSource.outputText);
		} else if (hasJS) {
			const rawSource = this.$fs.readText(configJSFilePath);
			// console.log('rawSource:', rawSource)
			// config = eval(rawSource);
			config = this.requireFromString(rawSource, configJSFilePath);
		}

		// console.log('config: ', config);

		return config;
	}

	public getValue(key: string): any {
		return _.get(this.readConfig(), key);
	}

	public async setValue(
		key: string,
		value: SupportedConfigValues
	): Promise<boolean> {
		const { hasTS, configJSFilePath, configTSFilePath } = this.detectInfo();
		const configFilePath = configTSFilePath || configJSFilePath;

		if (!this.$fs.exists(configFilePath)) {
			this.writeDefaultConfig(this.projectHelper.projectDir);
		}

		if (typeof value === "object") {
			let allSuccessful = true;

			this.flattenObjectToPaths(value).forEach((prop) => {
				if (!this.setValue(prop.key, prop.value)) {
					allSuccessful = false;
				}
			});

			return allSuccessful;
		}

		const configContent = this.$fs.readText(configFilePath);

		try {
			const transformer: IConfigTransformer = new ConfigTransformer(
				configContent
			);
			const newContent = transformer.setValue(key, value);
			const prettierOptions = (await resolvePrettierConfig(
				this.projectHelper.projectDir,
				{ editorconfig: true }
			)) || {
				semi: false,
				singleQuote: true,
			};
			this.$logger.trace(
				"updating config, prettier options: ",
				prettierOptions
			);
			this.$fs.writeFile(
				configFilePath,
				prettierFormat(newContent, {
					...prettierOptions,
					parser: "typescript",
				})
			);
		} catch (error) {
			this.$logger.error(`Failed to update config.` + error);
		} finally {
			// verify config is updated correctly
			if (this.getValue(key) !== value) {
				this.$logger.error(
					`${EOL}Failed to update ${
						hasTS ? CONFIG_FILE_NAME_TS : CONFIG_FILE_NAME_JS
					}.${EOL}`
				);
				this.$logger.printMarkdown(
					`Please manually update \`${
						hasTS ? CONFIG_FILE_NAME_TS : CONFIG_FILE_NAME_JS
					}\` and set \`${key}\` to \`${value}\`.${EOL}`
				);

				// restore original content
				this.$fs.writeFile(configFilePath, configContent);
				return false;
			}
			return true;
		}
	}

	public writeDefaultConfig(projectDir: string, appId?: string) {
		const configTSFilePath = path.join(
			projectDir || this.projectHelper.projectDir,
			CONFIG_FILE_NAME_TS
		);

		this.$fs.writeFile(configTSFilePath, this.getDefaultTSConfig(appId));
	}

	private _readAndUpdateLegacyConfig(configNSConfigFilePath: string) {
		let nsConfig: any = this.$fs.readJson(configNSConfigFilePath);
		if (this._handledLegacyId) {
			return;
		}
		this._handledLegacyId = true;

		const packageJson = this.$fs.readJson(
			path.join(this.projectHelper.projectDir, "package.json")
		);

		if (
			packageJson &&
			packageJson.nativescript &&
			packageJson.nativescript.id
		) {
			nsConfig = {
				id: packageJson.nativescript.id,
				...nsConfig,
			};
			this.$fs.writeJson(configNSConfigFilePath, nsConfig);
		}

		return nsConfig;
	}

	public writeLegacyNSConfigIfNeeded(
		projectDir: string,
		runtimePackage: IBasePluginData
	) {
		const { usesLegacyConfig } = this.detectInfo(
			projectDir || this.projectHelper.projectDir
		);

		if (usesLegacyConfig) {
			return;
		}

		if (
			runtimePackage.version &&
			semver.gte(runtimePackage.version, "7.0.0-rc.5")
		) {
			return;
		}

		const runtimePackageDisplay = `${runtimePackage.name}${
			runtimePackage.version ? " v" + runtimePackage.version : ""
		}`;

		this.$logger.info();
		this.$logger.printMarkdown(`
Using __${runtimePackageDisplay}__ which requires \`nsconfig.json\` to be present.
Writing \`nsconfig.json\` based on the values set in \`${CONFIG_FILE_NAME_DISPLAY}\`.
You may add \`nsconfig.json\` to \`.gitignore\` as the CLI will regenerate it as necessary.`);

		const nsConfigPath = path.join(
			projectDir || this.projectHelper.projectDir,
			"nsconfig.json"
		);

		this.$fs.writeJson(nsConfigPath, {
			_info1: `Auto Generated for backwards compatibility with the currently used runtime.`,
			_info2: `Do not edit this file manually, as any changes will be ignored.`,
			_info3: `Config changes should be done in ${CONFIG_FILE_NAME_DISPLAY} instead.`,
			appPath: this.getValue("appPath"),
			appResourcesPath: this.getValue("appResourcesPath"),
		});
	}

	private flattenObjectToPaths(
		obj: any,
		basePath?: string
	): Array<{ key: string; value: any }> {
		const toPath = (key: any) => [basePath, key].filter(Boolean).join(".");
		return Object.keys(obj).reduce((all: any, key) => {
			if (typeof obj[key] === "object") {
				return [...all, ...this.flattenObjectToPaths(obj[key], toPath(key))];
			}
			return [
				...all,
				{
					key: toPath(key),
					value: obj[key],
				},
			];
		}, []);
	}
}

injector.register("projectConfigService", ProjectConfigService);
