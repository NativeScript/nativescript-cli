///<reference path="../.d.ts"/>

import path = require("path");
import assert = require("assert");

export class ProjectDataService implements IProjectDataService {
	private projectFileName: string;
	private projectData: IDictionary<any>;

	constructor(private $fs: IFileSystem,
		private $staticConfig: IStaticConfig) {
	}

	public initialize(projectDir: string): void {
		if(!this.projectFileName) {
			this.projectFileName = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
		}
	}

	public getValue(propertyName: string): IFuture<any> {
		return (() => {
			this.loadProjectFile().wait();
			return this.projectData ? this.projectData[propertyName] : null;
		}).future<string>()();
	}

	public setValue(key: string, value: any): IFuture<void> {
		return (() => {
			this.loadProjectFile().wait();
			this.projectData[key] = value;
			this.$fs.writeJson(this.projectFileName, this.projectData, "\t").wait();
		}).future<void>()();
	}

	private loadProjectFile(): IFuture<void> {
		return (() => {
			assert.ok(this.projectFileName, "Initialize method of projectDataService is not called");

			if(!this.projectData) {
				if(!this.$fs.exists(this.projectFileName).wait()) {
					this.$fs.writeFile(this.projectFileName, null).wait();
				}

				this.projectData = this.$fs.readJson(this.projectFileName).wait() || Object.create(null);
			}
		}).future<void>()();
	}
}
$injector.register("projectDataService", ProjectDataService);