export class XCConfigService {
	constructor(private $fs: IFileSystem) {
	}

	/**
	 * Returns the Value of a Property from a XC Config file.
	 * @param xcconfigFilePath
	 * @param propertyName
	 */
	public readPropertyValue(xcconfigFilePath: string, propertyName: string): string {
		if (this.$fs.exists(xcconfigFilePath)) {
			const text = this.$fs.readText(xcconfigFilePath);

			let property: string;
			let isPropertyParsed: boolean = false;
			text.split(/\r?\n/).forEach((line) => {
				line = line.replace(/\/(\/)[^\n]*$/, "");
				if (line.indexOf(propertyName) >= 0) {
					const parts = line.split("=");
					if (parts.length > 1 && parts[1]) {
						property = parts[1].trim();
						isPropertyParsed = true;
						if (property[property.length - 1] === ';') {
							property = property.slice(0, -1);
						}
					}
				}
			});

			if (isPropertyParsed) {
				// property can be an empty string, so we don't check for that.
				return property;
			}
		}

		return null;
	}
}

$injector.register("xCConfigService", XCConfigService);
