import * as path from "path";

export class AndroidProjectPropertiesManager implements IAndroidProjectPropertiesManager {
	private _editor: IPropertiesParserEditor = null;
	private filePath: string = null;
	private projectReferences: ILibRef[];
	private dirty = false;

	constructor(private $propertiesParser: IPropertiesParser,
		private $logger: ILogger,
		directoryPath: string) {
		this.filePath = path.join(directoryPath, "project.properties");
	}

	public async getProjectReferences(): Promise<ILibRef[]> {
		if (!this.projectReferences || this.dirty) {
			const allProjectProperties = await this.getAllProjectProperties();
			const allProjectPropertiesKeys = _.keys(allProjectProperties);
			this.projectReferences = _(allProjectPropertiesKeys)
				.filter(key => _.startsWith(key, "android.library.reference."))
				.map(key => this.createLibraryReference(key, allProjectProperties[key]))
				.value();
		}

		return this.projectReferences;
	}

	public async addProjectReference(referencePath: string): Promise<void> {
		const references = await this.getProjectReferences();
		const libRefExists = _.some(references, r => path.normalize(r.path) === path.normalize(referencePath));
		if (!libRefExists) {
			await this.addToPropertyList("android.library.reference", referencePath);
		}
	}

	public async removeProjectReference(referencePath: string): Promise<void> {
		const references = await this.getProjectReferences();
		const libRefExists = _.some(references, r => path.normalize(r.path) === path.normalize(referencePath));
		if (libRefExists) {
			await this.removeFromPropertyList("android.library.reference", referencePath);
		} else {
			this.$logger.error(`Could not find ${referencePath}.`);
		}
	}

	private async createEditor(): Promise<any> {
		return this._editor || await this.$propertiesParser.createEditor(this.filePath);
	}

	private buildKeyName(key: string, index: number): string {
		return `${key}.${index}`;
	}

	private async getAllProjectProperties(): Promise<IStringDictionary> {
		return this.$propertiesParser.read(this.filePath);
	}

	private createLibraryReference(referenceName: string, referencePath: string): ILibRef {
		return {
			idx: parseInt(referenceName.split("android.library.reference.")[1]),
			key: referenceName,
			path: referencePath,
			adjustedPath: path.join(path.dirname(this.filePath), referencePath)
		};
	}

	private async addToPropertyList(key: string, value: string): Promise<void> {
		const editor = await this.createEditor();
		let i = 1;
		while (editor.get(this.buildKeyName(key, i))) {
			i++;
		}

		editor.set(this.buildKeyName(key, i), value);
		await this.$propertiesParser.saveEditor();
		this.dirty = true;
	}

	private async removeFromPropertyList(key: string, value: string): Promise<void> {
		const editor = await this.createEditor();
		const valueLowerCase = value.toLowerCase();
		let i = 1;
		let currentValue: any;
		while (currentValue = editor.get(this.buildKeyName(key, i))) {
			if (currentValue.toLowerCase() === valueLowerCase) {
				while (currentValue = editor.get(this.buildKeyName(key, i + 1))) {
					editor.set(this.buildKeyName(key, i), currentValue);
					i++;
				}

				editor.set(this.buildKeyName(key, i));
				break;
			}

			i++;
		}

		await this.$propertiesParser.saveEditor();
		this.dirty = true;
	}
}
