import {
	CONFIG_FILE_NAME_JS,
	CONFIG_FILE_NAME_TS,
	CONFIG_FILE_NAME_DISPLAY,
} from "../constants";
import * as path from "path";
import * as _ from "lodash";
import * as ts from "typescript";
import { IFileSystem, IProjectHelper } from "../common/declarations";
import { injector } from "../common/yok";
import { INsConfig, IProjectConfigService } from "../definitions/project";
import { IInjector } from "../common/definitions/yok";

export class ProjectConfigService implements IProjectConfigService {
	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
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

	public detectInfo(
		projectDir?: string
	): {
		hasTS: boolean;
		hasJS: boolean;
		configJSFilePath: string;
		configTSFilePath: string;
	} {
		const configJSFilePath = path.join(
			projectDir || this.projectHelper.projectDir,
			CONFIG_FILE_NAME_JS
		);
		const configTSFilePath = path.join(
			projectDir || this.projectHelper.projectDir,
			CONFIG_FILE_NAME_TS
		);
		const hasTS = this.$fs.exists(configTSFilePath);
		const hasJS = this.$fs.exists(configJSFilePath);

		if (!hasTS && !hasJS) {
			throw new Error(
				`You do not appear to have a ${CONFIG_FILE_NAME_DISPLAY} file. Please install NativeScript 7+ "npm i -g nativescript". You can also try running "ns migrate" after you have the latest installed. Exiting for now.`
			);
		}

		if (hasTS && hasJS) {
			this.$logger.warn(
				`You have both a ${CONFIG_FILE_NAME_JS} and ${CONFIG_FILE_NAME_TS} file. Defaulting to ${CONFIG_FILE_NAME_TS}.`
			);
		}

		return {
			hasTS,
			hasJS,
			configJSFilePath,
			configTSFilePath,
		};
	}

	public readConfig(projectDir?: string): INsConfig {
		const { hasTS, configJSFilePath, configTSFilePath } = this.detectInfo(
			projectDir
		);

		let config: INsConfig;

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
		} else {
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

  // TODO: improve to set any value
	// public setValue(projectDir?: string) {
	public setAppId(projectId: string, projectDir?: string) {
		const { hasTS, configJSFilePath, configTSFilePath } = this.detectInfo(
			projectDir
		);

		const configPath = hasTS ? configTSFilePath : configJSFilePath;

		const rawSource = this.$fs.readText(configPath);
		this.$fs.writeFile(
			configPath,
			rawSource.replace(`org.nativescript.app`, projectId)
		);
	}
}

injector.register("projectConfigService", ProjectConfigService);
