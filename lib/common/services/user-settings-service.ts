import * as path from "path";
import { parseJson } from "../helpers";

export class UserSettingsServiceBase implements IUserSettingsService {
	private userSettingsFilePath: string = null;
	protected userSettingsData: any = null;
	private get lockFilePath(): string {
		return `${this.userSettingsFilePath}.lock`;
	}

	constructor(userSettingsFilePath: string,
		protected $fs: IFileSystem,
		protected $lockfile: ILockFile,
		private $logger: ILogger) {
		this.userSettingsFilePath = userSettingsFilePath;
	}

	public async getSettingValue<T>(settingName: string): Promise<T> {
		const action = async (): Promise<T> => {
			await this.loadUserSettingsFile();
			return this.userSettingsData ? this.userSettingsData[settingName] : null;
		};

		return this.executeActionWithLock<T>(action);
	}

	public async saveSetting<T>(key: string, value: T): Promise<void> {
		const settingObject: any = {};
		settingObject[key] = value;

		return this.saveSettings(settingObject);
	}

	public async removeSetting(key: string): Promise<void> {
		const action = async (): Promise<void> => {
			await this.loadUserSettingsFile();

			delete this.userSettingsData[key];
			await this.saveSettings();
		};

		return this.executeActionWithLock<void>(action);
	}

	private async executeActionWithLock<T>(action: () => Promise<T>): Promise<T> {
		try {
			await this.$lockfile.lock(this.lockFilePath);
			const result = await action();
			return result;
		} finally {
			this.$lockfile.unlock(this.lockFilePath);
		}
	}

	public saveSettings(data?: any): Promise<void> {
		const action = async (): Promise<void> => {
			await this.loadUserSettingsFile();
			this.userSettingsData = this.userSettingsData || {};

			_(data)
				.keys()
				.each(propertyName => {
					this.userSettingsData[propertyName] = data[propertyName];
				});

			this.$fs.writeJson(this.userSettingsFilePath, this.userSettingsData);
		};

		return this.executeActionWithLock<void>(action);
	}

	// TODO: Remove Promise, reason: writeFile - blocked as other implementation of the interface has async operation.
	public async loadUserSettingsFile(): Promise<void> {
		if (!this.userSettingsData) {
			await this.loadUserSettingsData();
		}
	}

	protected async loadUserSettingsData(): Promise<void> {
		if (!this.$fs.exists(this.userSettingsFilePath)) {
			const unexistingDirs = this.getUnexistingDirectories(this.userSettingsFilePath);

			this.$fs.writeFile(this.userSettingsFilePath, null);

			// when running under 'sudo' we create the <path to home dir>/.local/share/.nativescript-cli dir with root as owner
			// and other Applications cannot access this directory anymore. (bower/heroku/etc)
			if (process.env.SUDO_USER) {
				for (const dir of unexistingDirs) {
					await this.$fs.setCurrentUserAsOwner(dir, process.env.SUDO_USER);
				}
			}
		}

		const data = this.$fs.readText(this.userSettingsFilePath);

		try {
			this.userSettingsData = parseJson(data);
		} catch (err) {
			this.$logger.trace(`Error while trying to parseJson ${data} data from ${this.userSettingsFilePath} file. Err is: ${err}`);
			this.$fs.deleteFile(this.userSettingsFilePath);
		}
	}

	private getUnexistingDirectories(filePath: string): Array<string> {
		const unexistingDirs: Array<string> = [];
		let currentDir = path.join(filePath, "..");
		while (true) {
			// this directory won't be created.
			if (this.$fs.exists(currentDir)) {
				break;
			}
			unexistingDirs.push(currentDir);
			currentDir = path.join(currentDir, "..");
		}
		return unexistingDirs;
	}
}
