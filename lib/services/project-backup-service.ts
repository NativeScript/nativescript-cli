import { IBackup, IProjectBackupService } from "../definitions/project";
import { IFileSystem, IProjectHelper } from "../common/declarations";
import { injector } from "../common/yok";
import * as path from "path";
import { color } from "../color";

export class ProjectBackupService implements IProjectBackupService {
	constructor(
		protected $fs: IFileSystem,
		protected $logger: ILogger,
		protected $projectHelper: IProjectHelper
	) {}

	getBackup(backupName: string): IBackup {
		return new ProjectBackupService.Backup(this, backupName);
	}

	backup(name: string, pathsToBackup: string[]): IBackup {
		const backup = new ProjectBackupService.Backup(this, name, pathsToBackup);
		return backup.create();
	}

	restore(name: string): IBackup {
		const backup = new ProjectBackupService.Backup(this, name);
		return backup.restore();
	}

	static Backup = class Backup implements IBackup {
		constructor(
			private $super: ProjectBackupService,
			private name: string,
			private pathsToBackup: string[] = [],
			private basePath: string = $super.$projectHelper.projectDir
		) {}

		get backupDir() {
			return path.resolve(this.basePath, `.${this.name}_backup`);
		}

		create() {
			const backupData = this.getBackupData();
			const backedUpPaths = backupData?.paths || [];
			this.$super.$logger.trace("creating backup: ", this.name);

			this.$super.$fs.createDirectory(this.backupDir);

			for (const pathToBackup of this.pathsToBackup) {
				const sourcePath = path.resolve(this.basePath, pathToBackup);
				const targetPath = path.resolve(this.backupDir, pathToBackup);
				if (this.$super.$fs.exists(sourcePath)) {
					this.$super.$logger.trace(
						`BACKING UP ${color.cyan(sourcePath)} -> ${color.green(targetPath)}`
					);
					this.$super.$fs.copyFile(sourcePath, targetPath);
					backedUpPaths.push(pathToBackup);
				}
			}

			// create backup.json
			this.$super.$fs.writeJson(path.resolve(this.backupDir, "_backup.json"), {
				name: this.name,
				paths: backedUpPaths
			});

			return this;
		}

		restore() {
			const backupData = this.getBackupData();

			if (!backupData) {
				return this;
			}

			for (const pathToBackup of backupData.paths) {
				const sourcePath = path.resolve(this.backupDir, pathToBackup);
				const targetPath = path.resolve(this.basePath, pathToBackup);
				this.$super.$logger.trace(
					`RESTORING ${color.green(sourcePath)} -> ${color.cyan(targetPath)}`
				);
				if (this.$super.$fs.exists(sourcePath)) {
					this.$super.$fs.copyFile(sourcePath, targetPath);
				}
			}
			this.$super.$logger.trace(backupData);
			// restore files

			return this;
		}

		isUpToDate() {
			const backupData = this.getBackupData();

			if (!backupData) {
				return false;
			}

			for (const pathToBackup of backupData.paths) {
				const sourcePath = path.resolve(this.backupDir, pathToBackup);

				// if any of the files don't exist the backup is not up-to-date
				if (!this.$super.$fs.exists(sourcePath)) {
					return false;
				}
			}

			return true;
		}

		remove() {
			if (!this.$super.$fs.exists(this.backupDir)) {
				this.$super.$logger.trace(
					`No backup named ${this.name} could be found.`
				);
				return;
			}

			this.$super.$fs.deleteDirectory(this.backupDir);

			return this;
		}

		addPath(backupPath: string) {
			this.pathsToBackup.push(path.relative(this.basePath, backupPath));

			return this;
		}

		addPaths(backupPaths: string[]) {
			backupPaths.forEach(this.addPath.bind(this));

			return this;
		}

		private getBackupData(): { name: string; paths: string[] } {
			if (!this.$super.$fs.exists(this.backupDir)) {
				this.$super.$logger.trace(
					`No backup named ${this.name} could be found.`
				);
				return;
			}
			const backupJSONPath = path.resolve(this.backupDir, "_backup.json");

			if (!this.$super.$fs.exists(backupJSONPath)) {
				this.$super.$logger.trace(
					`The backup ${this.name} does not contain a _backup.json.`
				);
				return;
			}

			return this.$super.$fs.readJson(backupJSONPath);
		}
	};
}

injector.register("projectBackupService", ProjectBackupService);
