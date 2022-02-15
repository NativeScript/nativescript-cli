import * as constants from "../constants";
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
import {
	INsConfig,
	IProjectConfigInformation,
	IProjectConfigService,
} from "../definitions/project";
import { IInjector } from "../common/definitions/yok";
import {
	ConfigTransformer,
	IConfigTransformer,
	SupportedConfigValues,
} from "../tools/config-manipulation/config-transformer";
import { IBasePluginData } from "../definitions/plugins";
import { injector } from "../common/yok";
import { EOL } from "os";
import {
	format as prettierFormat,
	resolveConfig as resolvePrettierConfig,
} from "prettier";
import { cache, exported } from "../common/decorators";
import { IOptions } from "../declarations";
import semver = require("semver/preload");
import { ICleanupService } from "../definitions/cleanup-service";

export class ProjectConfigService implements IProjectConfigService {
	private forceUsingNewConfig: boolean = false;
	private forceUsingLegacyConfig: boolean = false;

	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $injector: IInjector,
		private $options: IOptions,
		private $cleanupService: ICleanupService
	) {}

	public setForceUsingNewConfig(force: boolean) {
		return (this.forceUsingNewConfig = force);
	}

	public setForceUsingLegacyConfig(force: boolean) {
		return (this.forceUsingLegacyConfig = force);
	}

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

	public getDefaultTSConfig(
		appId: string = "org.nativescript.app",
		appPath: string = "app"
	) {
		return `import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: '${appId}',
  appPath: '${appPath}',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  }
} as NativeScriptConfig;`.trim();
	}

	@cache() // @cache should prevent the message being printed multiple times
	private warnUsingLegacyNSConfig() {
		// todo: remove hack
		const isMigrate = _.get(this.$options, "argv._[0]") === "migrate";
		if (isMigrate) {
			return;
		}
		this.$logger.warn(
			`You are using the deprecated ${CONFIG_NS_FILE_NAME} file. Just be aware that NativeScript now has an improved ${CONFIG_FILE_NAME_DISPLAY} file for when you're ready to upgrade this project.`
		);
	}

	public detectProjectConfigs(projectDir?: string): IProjectConfigInformation {
		// allow overriding config name with env variable or --config (or -c)
		let configName: string | boolean =
			process.env.NATIVESCRIPT_CONFIG_NAME ?? this.$options.config;

		if (configName === "false") {
			configName = false;
		}

		const possibleConfigPaths = [
			configName &&
				(configName?.endsWith(".ts") ? configName : `${configName}.ts`),
			configName &&
				(configName?.endsWith(".js") ? configName : `${configName}.js`),
			configName &&
				(configName?.endsWith(".json") ? configName : `${configName}.json`),
			CONFIG_FILE_NAME_TS,
			CONFIG_FILE_NAME_JS,
			CONFIG_NS_FILE_NAME,
		]
			.filter(Boolean)
			.map((c) => {
				if (this.$fs.isRelativePath(c)) {
					const dir = projectDir || this.projectHelper.projectDir;

					if (!dir) {
						return c;
					}

					return path.join(dir, c);
				}

				return c;
			});

		const existingConfigs = possibleConfigPaths.filter((path) => {
			return this.$fs.exists(path);
		});

		// push the first possible config into the "existing" list
		const hasExistingConfig = !!existingConfigs.length;
		if (!hasExistingConfig) {
			this.$logger.trace(
				`No config file found - falling back to ${possibleConfigPaths[0]}.`
			);
			existingConfigs.push(possibleConfigPaths[0]);
		}

		const TSConfigPath = existingConfigs.find((config) =>
			config.endsWith(".ts")
		);
		const JSConfigPath = existingConfigs.find((config) =>
			config.endsWith(".js")
		);
		const NSConfigPath = existingConfigs.find((config) =>
			config.endsWith(".json")
		);

		const hasTSConfig = !!TSConfigPath && hasExistingConfig;
		const hasJSConfig = !!JSConfigPath && hasExistingConfig;
		const hasNSConfig = !!NSConfigPath && hasExistingConfig;
		const usingNSConfig = !(hasTSConfig || hasJSConfig);

		if (hasTSConfig && hasJSConfig) {
			this.$logger.warn(
				`You have both a ${CONFIG_FILE_NAME_JS} and ${CONFIG_FILE_NAME_TS} file. Defaulting to ${CONFIG_FILE_NAME_TS}.`
			);
		}

		return {
			hasTSConfig,
			hasJSConfig,
			hasNSConfig,
			usingNSConfig,
			TSConfigPath,
			JSConfigPath,
			NSConfigPath,
		};
	}

	@exported("projectConfigService")
	public readConfig(projectDir?: string): INsConfig {
		const info = this.detectProjectConfigs(projectDir);

		if (
			this.forceUsingLegacyConfig ||
			(info.usingNSConfig && !this.forceUsingNewConfig)
		) {
			this.$logger.trace(
				"Project Config Service using legacy configuration..."
			);
			if (!this.forceUsingLegacyConfig && info.hasNSConfig) {
				this.warnUsingLegacyNSConfig();
			}
			return this.fallbackToLegacyNSConfig(info);
		}

		let config: INsConfig;

		if (info.hasTSConfig) {
			const rawSource = this.$fs.readText(info.TSConfigPath);
			const transpiledSource = ts.transpileModule(rawSource, {
				compilerOptions: { module: ts.ModuleKind.CommonJS },
			});
			const result: any = this.requireFromString(
				transpiledSource.outputText,
				info.TSConfigPath
			);
			config = result["default"] ? result["default"] : result;
		} else if (info.hasJSConfig) {
			const rawSource = this.$fs.readText(info.JSConfigPath);
			config = this.requireFromString(rawSource, info.JSConfigPath);
		}

		return config;
	}

	@exported("projectConfigService")
	public getValue(key: string, defaultValue?: any): any {
		return _.get(this.readConfig(), key, defaultValue);
	}

	@exported("projectConfigService")
	public async setValue(
		key: string,
		value: SupportedConfigValues
	): Promise<boolean> {
		const {
			hasTSConfig,
			hasNSConfig,
			TSConfigPath,
			JSConfigPath,
			usingNSConfig,
			NSConfigPath,
		} = this.detectProjectConfigs();
		const configFilePath = TSConfigPath || JSConfigPath;

		if (
			this.forceUsingLegacyConfig ||
			(usingNSConfig && !this.forceUsingNewConfig)
		) {
			try {
				this.$logger.trace(
					"Project Config Service -> setValue writing to legacy config."
				);
				const NSConfig = hasNSConfig ? this.$fs.readJson(NSConfigPath) : {};
				_.set(NSConfig, key, value);
				this.$fs.writeJson(NSConfigPath, NSConfig);
				return true;
			} catch (error) {
				this.$logger.trace(
					`Failed to setValue on legacy config. Error is ${error.message}`,
					error
				);
				return false;
			}
		}

		if (!this.$fs.exists(configFilePath)) {
			this.writeDefaultConfig(this.projectHelper.projectDir);
		}

		if (typeof value === "object") {
			let allSuccessful = true;

			for (const prop of this.flattenObjectToPaths(value)) {
				if (!(await this.setValue(prop.key, prop.value))) {
					allSuccessful = false;
				}
			}
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
						hasTSConfig ? CONFIG_FILE_NAME_TS : CONFIG_FILE_NAME_JS
					}.${EOL}`
				);
				this.$logger.printMarkdown(
					`Please manually update \`${
						hasTSConfig ? CONFIG_FILE_NAME_TS : CONFIG_FILE_NAME_JS
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
		const TSConfigPath = path.resolve(projectDir, CONFIG_FILE_NAME_TS);

		if (this.$fs.exists(TSConfigPath)) {
			return false;
		}

		const possibleAppPaths = [
			path.resolve(projectDir, constants.SRC_DIR),
			path.resolve(projectDir, constants.APP_FOLDER_NAME),
		];

		let appPath = possibleAppPaths.find((possiblePath) =>
			this.$fs.exists(possiblePath)
		);
		if (appPath) {
			appPath = path.relative(projectDir, appPath).replace(path.sep, "/");
		}

		this.$fs.writeFile(TSConfigPath, this.getDefaultTSConfig(appId, appPath));

		return TSConfigPath;
	}

	private fallbackToLegacyNSConfig(info: IProjectConfigInformation) {
		const additionalData: Array<object> = [];
		const NSConfig: any = info.hasNSConfig
			? this.$fs.readJson(info.NSConfigPath)
			: {};

		try {
			// injecting here to avoid circular dependency
			const projectData = this.$injector.resolve("projectData");
			const embeddedPackageJsonPath = path.resolve(
				this.projectHelper.projectDir,
				projectData.getAppDirectoryRelativePath(),
				constants.PACKAGE_JSON_FILE_NAME
			);
			const embeddedPackageJson = this.$fs.readJson(embeddedPackageJsonPath);
			// filter only the supported keys
			additionalData.push(
				_.pick(embeddedPackageJson, [
					"android",
					"ios",
					"profiling",
					"cssParser",
					"discardUncaughtJsExceptions",
					"main",
				])
			);
		} catch (err) {
			this.$logger.trace(
				"failed to add embedded package.json data to config",
				err
			);
			// ignore if the file doesn't exist
		}

		try {
			const packageJson = this.$fs.readJson(
				path.join(this.projectHelper.projectDir, "package.json")
			);

			// add app id to additionalData for backwards compatibility
			if (
				!NSConfig.id &&
				packageJson &&
				packageJson.nativescript &&
				packageJson.nativescript.id
			) {
				const ids = packageJson.nativescript.id;
				if (typeof ids === "string") {
					additionalData.push({
						id: packageJson.nativescript.id,
					});
				} else if (typeof ids === "object") {
					for (const platform of Object.keys(ids)) {
						additionalData.push({
							[platform]: {
								id: packageJson.nativescript.id[platform],
							},
						});
					}
				}
			}
		} catch (err) {
			this.$logger.trace("failed to read package.json data for config", err);
			// ignore if the file doesn't exist
		}

		return _.defaultsDeep({}, ...additionalData, NSConfig);
		// return Object.assign({}, ...additionalData, NSConfig);
	}

	public async writeLegacyNSConfigIfNeeded(
		projectDir: string,
		runtimePackage: IBasePluginData
	) {
		const { usingNSConfig } = this.detectProjectConfigs(projectDir);

		if (usingNSConfig) {
			return;
		}

		if (
			runtimePackage.version &&
			semver.gte(semver.coerce(runtimePackage.version), "7.0.0-rc.5")
		) {
			// runtimes >= 7.0.0-rc.5 support passing appPath and appResourcesPath through gradle project flags
			// so writing an nsconfig is not necessary.
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

		// mark the file for cleanup after the CLI exits
		await this.$cleanupService.addCleanupDeleteAction(nsConfigPath);
	}

	// todo: move into config manipulation
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
