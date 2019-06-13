import * as path from "path";

export class BaseUpdateController {
	constructor(protected $fs: IFileSystem) {
	}

	protected restoreBackup(folders: string[], tmpDir: string, projectData: IProjectData): void {
		for (const folder of folders) {
			this.$fs.deleteDirectory(path.join(projectData.projectDir, folder));

			const folderToCopy = path.join(tmpDir, folder);

			if (this.$fs.exists(folderToCopy)) {
				this.$fs.copyFile(folderToCopy, projectData.projectDir);
			}
		}
	}

	protected backup(folders: string[], tmpDir: string, projectData: IProjectData): void {
		this.$fs.deleteDirectory(tmpDir);
		this.$fs.createDirectory(tmpDir);
		for (const folder of folders) {
			const folderToCopy = path.join(projectData.projectDir, folder);
			if (this.$fs.exists(folderToCopy)) {
				this.$fs.copyFile(folderToCopy, tmpDir);
			}
		}
	}
}
