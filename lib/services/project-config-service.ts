import { CONFIG_FILE_NAME_JS, CONFIG_FILE_NAME_TS, CONFIG_FILE_NAME_DISPLAY } from "../constants";
import * as path from "path";
import * as _ from 'lodash';
import * as ts from 'typescript';
import { IFileSystem } from "../common/declarations";
import { injector } from "../common/yok";
import { IProjectData, INsConfig, IProjectConfigService } from "../definitions/project";
import { IInjector } from "../common/definitions/yok";

export class ProjectConfigService implements IProjectConfigService {
  private _config: INsConfig;

	constructor(
		private $fs: IFileSystem,
    private $logger: ILogger,
    private $injector: IInjector
	) {

  }

  get projectData(): IProjectData {
    return this.$injector.resolve('projectData');
  }

  public readConfig(projectDir?: string): INsConfig {
    const configJSFilePath = path.join(projectDir || this.projectData.projectDir, CONFIG_FILE_NAME_JS);
    const configTSFilePath = path.join(projectDir || this.projectData.projectDir, CONFIG_FILE_NAME_TS);

    const hasTS = this.$fs.exists(configTSFilePath);
    const hasJS = this.$fs.exists(configJSFilePath);

    if (!hasTS && !hasJS) {
      throw new Error(`You do not appear to have a ${CONFIG_FILE_NAME_DISPLAY} file. Please install NativeScript 7+ "npm i -g nativescript". You can also try running "ns migrate" after you have the latest installed. Exiting for now.`);
    }

    if (hasTS && hasJS) {
      this.$logger.warn(`You have both a ${CONFIG_FILE_NAME_JS} and ${CONFIG_FILE_NAME_TS} file. Defaulting to ${CONFIG_FILE_NAME_TS}.`);
    }

    let config: INsConfig;
    
		if (hasTS) {
      const rawSource = this.$fs.readText(configTSFilePath);
      const transpiledSource = ts.transpileModule(rawSource, { compilerOptions: { module: ts.ModuleKind.CommonJS }});
      // console.log('transpiledSource.outputText:', transpiledSource.outputText)
      config = eval(transpiledSource.outputText);
    } else {
      const rawSource = this.$fs.readText(configJSFilePath);
      // console.log('rawSource:', rawSource)
      config = eval(rawSource);
    }

    return config;
  }
  
  public getValue(key: string): any {
    if (!this._config) {
      this._config = this.readConfig();
    }
    return _.get(this._config, key);
  }
}

injector.register('projectConfigService', ProjectConfigService);
