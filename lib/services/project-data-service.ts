///<reference path="../.d.ts"/>
"use strict";

import constants = require("./../constants");
import path = require("path");
import assert = require("assert");

export class ProjectDataService implements IProjectDataService {
	private projectFilePath: string;
	private projectData: IDictionary<any>;

	constructor(private $fs: IFileSystem,
		private $staticConfig: IStaticConfig,
		private $errors: IErrors,
		private $logger: ILogger) {
	}

	public initialize(projectDir: string): void {
		if(!this.projectFilePath) {
			this.projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
		}
	}

	public getValue(propertyName: string): IFuture<any> {
		return (() => {
			this.loadProjectFile().wait();
			return this.projectData ? this.projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][propertyName] : null;
		}).future<string>()();
	}

	public setValue(key: string, value: any): IFuture<void> {
		return (() => {
			this.loadProjectFile().wait();
			if(!this.projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE]) {
				this.projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE] = Object.create(null);
			}
			this.projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][key] = value;
			this.$fs.writeJson(this.projectFilePath, this.projectData, "\t").wait();
		}).future<void>()();
	}

	private loadProjectFile(): IFuture<void> {
		return (() => {
			assert.ok(this.projectFilePath, "Initialize method of projectDataService is not called");

			if(!this.projectData) {
				if(!this.$fs.exists(this.projectFilePath).wait()) {
					this.$fs.writeFile(this.projectFilePath, null).wait();
				}

				this.projectData = this.$fs.readJson(this.projectFilePath).wait() || Object.create(null);
			}
		}).future<void>()();
	}
}
$injector.register("projectDataService", ProjectDataService);