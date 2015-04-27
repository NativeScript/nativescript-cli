///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import os = require("os");

export class ProjectData implements IProjectData {
	public projectDir: string;
	public platformsDir: string;
	public projectFilePath: string;
	public projectId: string;
	public projectName: string;

	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $projectHelper: IProjectHelper,
		private $staticConfig: IStaticConfig) {
		this.initializeProjectData().wait();
	}

	private initializeProjectData(): IFuture<void> {
		return(() => {
			var projectDir = this.$projectHelper.projectDir;
			// If no project found, projectDir should be null
			if(projectDir) {
				this.projectDir = projectDir;
				this.projectName = this.$projectHelper.sanitizeName(path.basename(projectDir));
				this.platformsDir = path.join(projectDir, "platforms");
				this.projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);

				if (this.$fs.exists(this.projectFilePath).wait()) {
					try {
						var fileContent = this.$fs.readJson(this.projectFilePath).wait();
						this.projectId = fileContent.id;
					} catch (err) {
						this.$errors.fail({formatStr: "The project file %s is corrupted." + os.EOL +
							"Consider restoring an earlier version from your source control or backup." + os.EOL +
							"Additional technical info: %s",
								suppressCommandHelp: true},
							this.projectFilePath, err.toString());
					}
				}
			} else {
				this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", process.cwd());
			}
		}).future<void>()();
	}
}
$injector.register("projectData", ProjectData);