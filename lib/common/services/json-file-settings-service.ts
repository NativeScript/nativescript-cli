import * as path from "path";
import { parseJson } from "../helpers";
import { IFileSystem } from "../declarations";
import { IJsonFileSettingsService } from "../definitions/json-file-settings-service";
import * as _ from "lodash";
import { injector } from "../yok";

export class JsonFileSettingsService implements IJsonFileSettingsService {
	private jsonSettingsFilePath: string = null;
	protected jsonSettingsData: any = null;
	private get lockFilePath(): string {
		return `${this.jsonSettingsFilePath}.lock`;
	}

	constructor(
		jsonFileSettingsPath: string,
		private $fs: IFileSystem,
		private $lockService: ILockService,
		private $logger: ILogger
	) {
		this.jsonSettingsFilePath = jsonFileSettingsPath;
	}

	public async getSettingValue<T>(
		settingName: string,
		cacheOpts?: { cacheTimeout: number }
	): Promise<T> {
		const action = async (): Promise<T> => {
			await this.loadUserSettingsFile();

			if (this.jsonSettingsData && _.has(this.jsonSettingsData, settingName)) {
				const data = this.jsonSettingsData[settingName];
				const dataToReturn = data.modifiedByCacheMechanism ? data.value : data;
				if (cacheOpts && cacheOpts.cacheTimeout) {
					if (!data.modifiedByCacheMechanism) {
						// If data has no cache, but we want to check the timeout, consider the data as outdated.
						// this should be a really rare case
						return null;
					}

					const currentTime = Date.now();
					if (currentTime - data.time > cacheOpts.cacheTimeout) {
						return null;
					}
				}

				return dataToReturn;
			}

			return null;
		};

		return this.$lockService.executeActionWithLock<T>(
			action,
			this.lockFilePath
		);
	}

	public async saveSetting<T>(
		key: string,
		value: T,
		cacheOpts?: { useCaching: boolean }
	): Promise<void> {
		const settingObject: any = {};
		settingObject[key] = value;

		return this.saveSettings(settingObject, cacheOpts);
	}

	public async removeSetting(key: string): Promise<void> {
		const action = async (): Promise<void> => {
			await this.loadUserSettingsFile();

			delete this.jsonSettingsData[key];
			await this.saveSettings();
		};

		return this.$lockService.executeActionWithLock<void>(
			action,
			this.lockFilePath
		);
	}

	public saveSettings(
		data?: any,
		cacheOpts?: { useCaching: boolean }
	): Promise<void> {
		const action = async (): Promise<void> => {
			await this.loadUserSettingsFile();
			this.jsonSettingsData = this.jsonSettingsData || {};

			_(data)
				.keys()
				.each((propertyName) => {
					this.jsonSettingsData[propertyName] =
						cacheOpts &&
						cacheOpts.useCaching &&
						!data[propertyName].modifiedByCacheMechanism
							? {
									time: Date.now(),
									value: data[propertyName],
									modifiedByCacheMechanism: true,
							  }
							: data[propertyName];
				});

			this.$fs.writeJson(this.jsonSettingsFilePath, this.jsonSettingsData);
		};

		return this.$lockService.executeActionWithLock<void>(
			action,
			this.lockFilePath
		);
	}

	public async loadUserSettingsFile(): Promise<void> {
		if (!this.jsonSettingsData) {
			await this.loadUserSettingsData();
		}
	}

	private async loadUserSettingsData(): Promise<void> {
		if (!this.$fs.exists(this.jsonSettingsFilePath)) {
			const unexistingDirs = this.getUnexistingDirectories(
				this.jsonSettingsFilePath
			);

			this.$fs.writeFile(this.jsonSettingsFilePath, null);

			// when running under 'sudo' we create the <path to home dir>/.local/share/.nativescript-cli dir with root as owner
			// and other Applications cannot access this directory anymore. (bower/heroku/etc)
			if (process.env.SUDO_USER) {
				for (const dir of unexistingDirs) {
					await this.$fs.setCurrentUserAsOwner(dir, process.env.SUDO_USER);
				}
			}
		}

		const data = this.$fs.readText(this.jsonSettingsFilePath);

		try {
			this.jsonSettingsData = parseJson(data);
		} catch (err) {
			this.$logger.trace(
				`Error while trying to parseJson ${data} data from ${this.jsonSettingsFilePath} file. Err is: ${err}`
			);
			this.$fs.deleteFile(this.jsonSettingsFilePath);
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

injector.register("jsonFileSettingsService", JsonFileSettingsService, false);
